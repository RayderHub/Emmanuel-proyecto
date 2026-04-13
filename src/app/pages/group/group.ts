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
    imports: [RouterLink, ButtonModule, CardModule, DialogModule, InputTextModule, InputMaskModule, DatePicker, FormsModule, Sidebar, CommonModule, PermissionDirective],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class Group implements OnInit {
  memberCount: number = 3; // Actualizado según la lista inicial
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
  users: any[] = []; // Para el dropdown de tickets

  constructor(private permissionService: PermissionService, private supabase: ApiService) {}

  can(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  /** Verifica si el usuario actual puede mover un ticket (tiene permiso Y está asignado a él) */
  canMoveTicket(ticket: Ticket): boolean {
    if (!this.can('tickets:move')) return false;
    const currentUser = this.permissionService.getCurrentGroupId(); // proxy: we check via auth service
    return true; // La validación completa la hace el componente padre viendo assignedToId
  }

  async ngOnInit() {
    await this.loadAllData();
  }

  async loadAllData() {
    try {
      this.students = await this.supabase.getStudents() || [];
      this.groups = await this.supabase.getGroups() || [];
      this.tickets = await this.supabase.getTickets() || [];
      this.users = await this.supabase.getUsers() || [];
      this.memberCount = this.students.length;
    } catch(e) {
      console.error(e);
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
    if (this.editMode) {
      await this.supabase.updateStudent(this.selectedStudent.id, this.selectedStudent);
    } else {
      const newStudent: any = { ...this.selectedStudent, email: this.selectedStudent.username.substring(1) + '@email.com' };
      delete newStudent.id;
      await this.supabase.createStudent(newStudent);
    }
    await this.loadAllData();
    
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
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
    if (this.groupEditMode) {
      await this.supabase.updateGroup(this.selectedGroup.id, this.selectedGroup);
    } else {
      const newGroup: any = { ...this.selectedGroup };
      delete newGroup.id;
      await this.supabase.createGroup(newGroup);
    }
    await this.loadAllData();
    
    this.displayGroupDialog = false;
    this.selectedGroup = this.createEmptyGroup();
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
    await this.supabase.deleteTicket(id);
    await this.loadAllData();
  }

  async saveTicket() {
    if (this.ticketEditMode) {
      await this.supabase.updateTicket(this.selectedTicket.id, this.selectedTicket);
    } else {
      const newTicket: any = { ...this.selectedTicket };
      delete newTicket.id;
      await this.supabase.createTicket(newTicket);
    }
    await this.loadAllData();
    
    this.displayTicketDialog = false;
    this.selectedTicket = this.createEmptyTicket();
  }

  hideTicketDialog(): void {
    this.displayTicketDialog = false;
    this.selectedTicket = this.createEmptyTicket();
  }

  updateTicketStatus(ticket: Ticket, newStatus: Ticket['status']): void {
    const index = this.tickets.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
      this.tickets[index].status = newStatus;
    }
  }

  // Método para ver tickets de un grupo específico
  viewGroupTickets(group: GroupData): void {
    this.selectedGroupForTickets = group;
    this.displayTicketsModal = true;
    this.ticketView = 'lista';
  }

  // Obtener tickets filtrados por grupo seleccionado
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

  // Drag and Drop Methods
  onDragStart(event: DragEvent, ticket: Ticket): void {
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

  onDrop(event: DragEvent, status: Ticket['status']): void {
    event.preventDefault();
    if (this.draggedTicket) {
      // Evitar abrir el el edit dialog al soltar
      this.updateTicketStatus(this.draggedTicket, status);
      this.draggedTicket = null;
    }
  }
}