import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { PermissionDirective } from '../../directives/permission.directive';
import { ApiService } from '../../services/api.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

interface Student {
  id: number;
  username: string;
  email: string;
  fullName: string;
  birthDate: string;
  address: string;
  phone: string;
}

interface GroupData {
  id: number;
  name: string;
  description: string;
  course: string;
  semester: string;
  createdAt: string;
  studentCount: number;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'pendiente' | 'en-proceso' | 'revision' | 'finalizado';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  assignedTo?: string;
  assignedToId?: string;
  createdAt: string;
  dueDate: string;
  groupId?: number; // ID del grupo al que pertenece el ticket
}

@Component({
    selector: 'app-group',
    standalone: true,
    imports: [RouterLink, ButtonModule, CardModule, DialogModule, InputTextModule, InputMaskModule, DatePicker, FormsModule, Sidebar, CommonModule, PermissionDirective, ToastModule],
    providers: [MessageService],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class Group implements OnInit {
  memberCount: number = 3; // Actualizado según la lista inicial
  isLoading: boolean = false;  // ← indicador de carga de datos
  isSaving: boolean = false;   // ← bloqueo de botones durante operaciones
  displayDialog: boolean = false;
  editMode: boolean = false;
  selectedStudent: Student = this.createEmptyStudent();
  
  // Properties for groups CRUD
  displayGroupDialog: boolean = false;
  groupEditMode: boolean = false;
  selectedGroup: GroupData = this.createEmptyGroup();

  // Properties for view management
  displayTicketsModal: boolean = false;
  ticketView: 'lista' | 'kanban' = 'lista';
  displayTicketDialog: boolean = false;
  ticketEditMode: boolean = false;
  selectedTicket: Ticket = this.createEmptyTicket();
  selectedGroupForTickets: GroupData | null = null; // Grupo seleccionado para ver tickets
  draggedTicket: Ticket | null = null; // Para Drag And Drop
  dragOverStatus: string | null = null; // columna resaltada durante drag
  users: any[] = []; // Para el dropdown de tickets
  todayDate: Date = new Date(); // Límite para evitar fechas pasadas

  constructor(
    private permissionService: PermissionService, 
    private supabase: ApiService,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  can(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  /** Verifica si el usuario actual puede mover un ticket */
  canMoveTicket(ticket?: Ticket): boolean {
    if (!ticket) return false;
    const user = this.authService.getCurrentUser();
    if (!user || !user.userId) return false;
    
    // 1. Administrador de Sistema (solo superAdmin y admin explícito)
    const role = user.role ? user.role.toLowerCase() : '';
    const isSystemAdmin = role === 'admin' || role === 'superadmin';
    
    // 2. Tienen permisos fuertes explícitamente configurados en el Sistema/Grupo?
    const hasStrongPerms = this.can('ticket:edit') || this.can('ticket:delete') || this.can('group:manage');
    
    if (isSystemAdmin || hasStrongPerms) {
      return true; // Acceso universal concedido
    }
    
    // 3. Muro de Contención para Usuarios/Estudiantes regulares
    // El estudiante debe poseer obligatoriamente SU UUID guardado en el ticket.
    const ticketOwnerAsString = (ticket.assignedToId || ticket.assignedTo || '').toString().trim();
    const currentUserIdAsString = user.userId.toString().trim();
    
    // Si el ticket no es de nadie, el estudiante regular tampoco puede robarlo ni moverlo
    if (!ticketOwnerAsString) return false;
    
    // Solo si coinciden exactamente los UUIDs el muro se abre.
    return ticketOwnerAsString === currentUserIdAsString;
  }

  async ngOnInit() {
    await this.loadAllData();
  }

  async loadAllData() {
    this.isLoading = true;
    try {
      // ── OPTIMIZACIÓN: peticiones en paralelo en lugar de secuencial ──
      // Antes tardaba 4x el tiempo de red; ahora tarda solo 1x
      const [students, groups, tickets, users] = await Promise.all([
        this.supabase.getStudents(),
        this.supabase.getGroups(),
        this.supabase.getTickets(),
        this.supabase.getUsers()
      ]);
      this.students = students || [];
      this.groups   = groups   || [];
      this.tickets  = tickets  || [];
      this.users    = users    || [];
      this.memberCount = this.students.length;
    } catch(e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  createEmptyStudent(): Student {
    return { id: 0, username: '', email: '', fullName: '', birthDate: '', address: '', phone: '' };
  }

  createEmptyGroup(): GroupData {
    return { id: 0, name: '', description: '', course: '', semester: '', createdAt: new Date().toLocaleDateString(), studentCount: 0 };
  }

  createEmptyTicket(): Ticket {
    return { id: 0, title: '', description: '', status: 'pendiente', priority: 'media', assignedTo: '', createdAt: new Date().toLocaleDateString(), dueDate: '' };
  }
  
  students: Student[] = [];
  groups: GroupData[] = [];
  tickets: Ticket[] = [];

  async deleteStudent(id: number) {
    await this.supabase.deleteStudent(id);
    await this.loadAllData();
  }

  editStudent(student: Student): void {
    this.selectedStudent = { ...student };
    this.editMode = true;
    this.displayDialog = true;
  }

  addStudent(): void {
    this.selectedStudent = this.createEmptyStudent();
    this.editMode = false;
    this.displayDialog = true;
  }

  async saveStudent() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.displayDialog = false; // cerrar inmediatamente para evitar doble click
    try {
      if (this.editMode) {
        await this.supabase.updateStudent(this.selectedStudent.id, this.selectedStudent);
      } else {
        const newStudent: any = { ...this.selectedStudent, email: this.selectedStudent.username.substring(1) + '@email.com' };
        delete newStudent.id;
        await this.supabase.createStudent(newStudent);
      }
      await this.loadAllData();
    } catch(e) {
      console.error(e);
    } finally {
      this.isSaving = false;
      this.selectedStudent = this.createEmptyStudent();
    }
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
  }

  manageUser(student: Student): void {
    console.log('Gestionar usuario integralmente:', student);
  }

  manageGroup(group: GroupData): void {
    console.log('Gestionar configuraciones del grupo:', group);
  }

  manageTicket(ticket: Ticket): void {
    console.log('Gestionar opciones de admin en el ticket:', ticket);
  }

  commentTicket(ticket: Ticket): void {
    console.log('Comentar en el ticket:', ticket);
  }

  // Group CRUD methods
  addGroup(): void {
    this.selectedGroup = this.createEmptyGroup();
    this.groupEditMode = false;
    this.displayGroupDialog = true;
  }

  editGroup(group: GroupData): void {
    this.selectedGroup = { ...group };
    this.groupEditMode = true;
    this.displayGroupDialog = true;
  }

  async deleteGroup(id: number) {
    await this.supabase.deleteGroup(id);
    await this.loadAllData();
  }

  async saveGroup() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.displayGroupDialog = false; // cerrar inmediatamente
    try {
      if (this.groupEditMode) {
        await this.supabase.updateGroup(this.selectedGroup.id, this.selectedGroup);
      } else {
        const newGroup: any = { ...this.selectedGroup };
        delete newGroup.id;
        await this.supabase.createGroup(newGroup);
      }
      await this.loadAllData();
    } catch(e) {
      console.error(e);
    } finally {
      this.isSaving = false;
      this.selectedGroup = this.createEmptyGroup();
    }
  }

  hideGroupDialog(): void {
    this.displayGroupDialog = false;
    this.selectedGroup = this.createEmptyGroup();
  }

  // View management methods
  showGroupsView(): void {
    this.displayTicketsModal = false;
  }

  showTicketsView(): void {
    this.displayTicketsModal = true;
    this.ticketView = 'lista';
  }

  switchTicketView(view: 'lista' | 'kanban'): void {
    this.ticketView = view;
  }

  addTicket(): void {
    this.selectedTicket = this.createEmptyTicket();
    // Asignar el grupo actual al nuevo ticket
    if (this.selectedGroupForTickets) {
      this.selectedTicket.groupId = this.selectedGroupForTickets.id;
    }
    this.ticketEditMode = false;
    this.displayTicketDialog = true;
  }

  editTicket(ticket: Ticket): void {
    this.selectedTicket = { ...ticket };
    this.ticketEditMode = true;
    this.displayTicketDialog = true;
  }

  async deleteTicket(id: number) {
    try {
      await this.supabase.deleteTicket(id);
      this.messageService.add({ severity: 'success', summary: 'Ticket Eliminado', detail: 'El ticket se eliminó correctamente' });
      await this.loadAllData();
    } catch(e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al eliminar el ticket' });
      console.error(e);
    }
  }

  async saveTicket() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.displayTicketDialog = false; // cerrar inmediatamente
    try {
      if (this.ticketEditMode) {
        await this.supabase.updateTicket(this.selectedTicket.id, this.selectedTicket);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket actualizado correctamente' });
      } else {
        const newTicket: any = { ...this.selectedTicket };
        delete newTicket.id;
        await this.supabase.createTicket(newTicket);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket creado exitosamente' });
      }
      await this.loadAllData();
    } catch(e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar el ticket' });
      console.error(e);
    } finally {
      this.isSaving = false;
      this.selectedTicket = this.createEmptyTicket();
    }
  }

  hideTicketDialog(): void {
    this.displayTicketDialog = false;
    this.selectedTicket = this.createEmptyTicket();
  }

  // ── PROBLEMA 3 FIX: ahora persiste el cambio en la DB ──────────────────
  async updateTicketStatus(ticket: Ticket, newStatus: Ticket['status']): Promise<void> {
    // Evitar llamada innecesaria si el status no cambió
    if (ticket.status === newStatus) return;

    const oldStatus = ticket.status;
    const index = this.tickets.findIndex(t => t.id === ticket.id);
    if (index === -1) return;

    // 1. Actualización optimista: cambio visual INMEDIATO (sin esperar API)
    this.tickets[index].status = newStatus;

    try {
      // 2. Persistir en la base de datos
      await this.supabase.updateTicket(ticket.id, { status: newStatus });
    } catch (e) {
      // 3. Rollback: si el API falla, revertir el cambio visual
      this.tickets[index].status = oldStatus;
      console.error('Error al actualizar status del ticket en DB:', e);
    }
  }

  // Método para ver tickets de un grupo específico
  viewGroupTickets(group: GroupData): void {
    this.selectedGroupForTickets = group;
    // CRÍTICO: Recargar los permisos ESPECÍFICOS para este grupo (para saber si le dimos permisos al Developer)
    this.permissionService.refreshPermissionsForGroup(group.id.toString());
    
    this.displayTicketsModal = true;
    this.ticketView = 'lista';
  }

  // Obtener tickets filtrados por grupo seleccionado (Todos pueden verlos ahora)
  getFilteredTickets(): Ticket[] {
    if (this.selectedGroupForTickets) {
      return this.tickets.filter(ticket => ticket.groupId === this.selectedGroupForTickets?.id);
    }
    return this.tickets;
  }

  getTicketsByStatus(status: Ticket['status']): Ticket[] {
    const filteredTickets = this.getFilteredTickets();
    return filteredTickets.filter(ticket => ticket.status === status);
  }

  /** Devuelve el nombre del usuario asignado, o 'Sin asignar' si no hay ninguno */
  getUserName(userId: string | undefined): string {
    if (!userId) return 'Sin asignar';
    const user = this.users.find(u => u.id === userId);
    return user ? (user.fullName || user.username || userId) : userId;
  }

  // Drag and Drop Methods
  onDragStart(event: DragEvent, ticket: Ticket): void {
    if (!this.canMoveTicket(ticket)) {
      event.preventDefault();
      return;
    }
    this.draggedTicket = ticket;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', ticket.id.toString());
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necesario para permitir el drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(status: string): void {
    this.dragOverStatus = status; // resaltar columna destino
  }

  onDragLeave(event: DragEvent): void {
    // Solo limpiar si salimos de la columna (no de elementos hijos)
    const relatedTarget = event.relatedTarget as Element;
    if (!relatedTarget || !(event.currentTarget as Element).contains(relatedTarget)) {
      this.dragOverStatus = null;
    }
  }

  onDrop(event: DragEvent, status: Ticket['status']): void {
    event.preventDefault();
    this.dragOverStatus = null; // quitar highlight
    // Blocker de seguridad (ahora evalúa el ticket que estás intentando soltar)
    if (!this.draggedTicket || !this.canMoveTicket(this.draggedTicket)) return; 
    
    this.updateTicketStatus(this.draggedTicket, status);
    this.draggedTicket = null;
  }
}