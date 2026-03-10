import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
// InputTextareaModule no disponible en esta versión - usando InputTextModule en su lugar
import { InputMaskModule } from 'primeng/inputmask';
import { DatePicker } from 'primeng/datepicker';
// DropdownModule no disponible en esta versión - usando alternativas nativas
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { PermissionDirective } from '../../directives/permission.directive';

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
  assignedTo: string;
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

  constructor(private permissionService: PermissionService) {}

  ngOnInit(): void {
    // Configurar permisos por defecto - puedes cambiar estos según necesites
    this.permissionService.setPermissions([
      'group.create',
      'group.edit', 
      'group.delete'
    ]);
  }

  createEmptyStudent(): Student {
    return {
      id: 0,
      username: '',
      email: '',
      fullName: '',
      birthDate: '',
      address: '',
      phone: ''
    };
  }

  createEmptyGroup(): GroupData {
    return {
      id: 0,
      name: '',
      description: '',
      course: '',
      semester: '',
      createdAt: new Date().toLocaleDateString(),
      studentCount: 0
    };
  }

  createEmptyTicket(): Ticket {
    return {
      id: 0,
      title: '',
      description: '',
      status: 'pendiente',
      priority: 'media',
      assignedTo: '',
      createdAt: new Date().toLocaleDateString(),
      dueDate: ''
    };
  }
  
  students: Student[] = [
    {
      id: 1,
      username: '@emmanuelh',
      email: 'emmanuel.hernandez@email.com',
      fullName: 'Emmanuel Hernandez Rodriguez',
      birthDate: '15/03/1995',
      address: 'Av. Insurgentes Sur 123, Col. Roma Norte, CDMX',
      phone: '5512345678'
    },
    {
      id: 2,
      username: '@juanp',
      email: 'juan.perez@email.com',
      fullName: 'Juan Perez Lopez',
      birthDate: '10/05/1998',
      address: 'Calle Falsa 123, Col. Centro, CDMX',
      phone: '5587654321'
    },
    {
      id: 3,
      username: '@mariag',
      email: 'maria.garcia@email.com',
      fullName: 'Maria Garcia Martinez',
      birthDate: '22/11/2000',
      address: 'Paseo de la Reforma 456, Col. Juarez, CDMX',
      phone: '5544332211'
    }
  ];

  groups: GroupData[] = [
    {
      id: 1,
      name: 'Grupo A',
      description: 'Grupo de programación avanzada',
      course: 'Programación',
      semester: '2024-1',
      createdAt: '15/01/2024',
      studentCount: 25
    },
    {
      id: 2,
      name: 'Grupo B', 
      description: 'Grupo de bases de datos',
      course: 'Bases de Datos',
      semester: '2024-1',
      createdAt: '20/01/2024',
      studentCount: 18
    },
    {
      id: 3,
      name: 'Grupo C',
      description: 'Grupo de desarrollo web',
      course: 'Desarrollo Web',
      semester: '2024-2',
      createdAt: '05/02/2024',
      studentCount: 22
    }
  ];

  tickets: Ticket[] = [
    {
      id: 1,
      title: 'Implementar CRUD de estudiantes',
      description: 'Crear funcionalidad completa para gestionar estudiantes',
      status: 'finalizado',
      priority: 'alta',
      assignedTo: 'Desarrollador Frontend',
      createdAt: '01/03/2024',
      dueDate: '05/03/2024',
      groupId: 1 // Grupo A
    },
    {
      id: 2,
      title: 'Diseñar interfaz de grupos',
      description: 'Crear diseño para la gestión de grupos académicos',
      status: 'en-proceso',
      priority: 'media',
      assignedTo: 'Diseñador UI/UX',
      createdAt: '02/03/2024',
      dueDate: '08/03/2024',
      groupId: 1 // Grupo A
    },
    {
      id: 3,
      title: 'Revisar código de autenticación',
      description: 'Revisar y optimizar el módulo de autenticación',
      status: 'pendiente',
      priority: 'alta',
      assignedTo: 'Desarrollador Backend',
      createdAt: '03/03/2024',
      dueDate: '10/03/2024',
      groupId: 2 // Grupo B
    },
    {
      id: 4,
      title: 'Testear funcionalidad de tickets',
      description: 'Realizar pruebas exhaustivas del sistema de tickets',
      status: 'revision',
      priority: 'media',
      assignedTo: 'QA Tester',
      createdAt: '04/03/2024',
      dueDate: '12/03/2024',
      groupId: 3 // Grupo C
    }
  ];

  deleteStudent(id: number): void {
    this.students = this.students.filter(s => s.id !== id);
    this.memberCount = this.students.length;
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

  saveStudent(): void {
    if (this.editMode) {
      // Actualizar estudiante existente
      const index = this.students.findIndex(s => s.id === this.selectedStudent.id);
      if (index !== -1) {
        this.students[index] = { ...this.selectedStudent };
      }
    } else {
      // Agregar nuevo estudiante
      const newStudent: Student = {
        ...this.selectedStudent,
        id: Date.now(),
        email: this.selectedStudent.username.substring(1) + '@email.com'
      };
      this.students.push(newStudent);
      this.memberCount = this.students.length;
    }
    
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
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

  deleteGroup(id: number): void {
    this.groups = this.groups.filter(g => g.id !== id);
  }

  saveGroup(): void {
    if (this.groupEditMode) {
      // Actualizar grupo existente
      const index = this.groups.findIndex(g => g.id === this.selectedGroup.id);
      if (index !== -1) {
        this.groups[index] = { ...this.selectedGroup };
      }
    } else {
      // Agregar nuevo grupo
      const newGroup: GroupData = {
        ...this.selectedGroup,
        id: Date.now()
      };
      this.groups.push(newGroup);
    }
    
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

  deleteTicket(id: number): void {
    this.tickets = this.tickets.filter(t => t.id !== id);
  }

  saveTicket(): void {
    if (this.ticketEditMode) {
      // Actualizar ticket existente
      const index = this.tickets.findIndex(t => t.id === this.selectedTicket.id);
      if (index !== -1) {
        this.tickets[index] = { ...this.selectedTicket };
      }
    } else {
      // Agregar nuevo ticket
      const newTicket: Ticket = {
        ...this.selectedTicket,
        id: Date.now()
      };
      this.tickets.push(newTicket);
    }
    
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