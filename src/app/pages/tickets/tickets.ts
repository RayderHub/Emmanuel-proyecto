import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'pendiente' | 'en-proceso' | 'revision' | 'finalizado';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  groupId?: number;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    InputTextModule,
    DatePicker,
    FormsModule,
    Sidebar,
    CommonModule
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {

  // Filtros
  filterStatus: string = '';
  filterPriority: string = '';
  searchText: string = '';

  // Dialog
  displayTicketDialog: boolean = false;
  ticketEditMode: boolean = false;
  selectedTicket: Ticket = this.createEmptyTicket();

  // Confirmación de eliminación
  displayDeleteConfirm: boolean = false;
  ticketToDeleteId: number | null = null;

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
      groupId: 1
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
      groupId: 1
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
      groupId: 2
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
      groupId: 3
    }
  ];

  ngOnInit(): void {}

  createEmptyTicket(): Ticket {
    return {
      id: 0,
      title: '',
      description: '',
      status: 'pendiente',
      priority: 'media',
      assignedTo: '',
      createdAt: new Date().toLocaleDateString('es-MX'),
      dueDate: ''
    };
  }

  getFilteredTickets(): Ticket[] {
    return this.tickets.filter(t => {
      const matchStatus = this.filterStatus ? t.status === this.filterStatus : true;
      const matchPriority = this.filterPriority ? t.priority === this.filterPriority : true;
      const matchSearch = this.searchText
        ? t.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
          t.assignedTo.toLowerCase().includes(this.searchText.toLowerCase())
        : true;
      return matchStatus && matchPriority && matchSearch;
    });
  }

  get totalCount(): number { return this.tickets.length; }
  get pendienteCount(): number { return this.tickets.filter(t => t.status === 'pendiente').length; }
  get enProcesoCount(): number { return this.tickets.filter(t => t.status === 'en-proceso').length; }
  get finalizadoCount(): number { return this.tickets.filter(t => t.status === 'finalizado').length; }

  addTicket(): void {
    this.selectedTicket = this.createEmptyTicket();
    this.ticketEditMode = false;
    this.displayTicketDialog = true;
  }

  editTicket(ticket: Ticket): void {
    this.selectedTicket = { ...ticket };
    this.ticketEditMode = true;
    this.displayTicketDialog = true;
  }

  confirmDeleteTicket(id: number): void {
    this.ticketToDeleteId = id;
    this.displayDeleteConfirm = true;
  }

  deleteTicket(): void {
    if (this.ticketToDeleteId !== null) {
      this.tickets = this.tickets.filter(t => t.id !== this.ticketToDeleteId);
      this.ticketToDeleteId = null;
    }
    this.displayDeleteConfirm = false;
  }

  cancelDelete(): void {
    this.ticketToDeleteId = null;
    this.displayDeleteConfirm = false;
  }

  saveTicket(): void {
    if (this.ticketEditMode) {
      const index = this.tickets.findIndex(t => t.id === this.selectedTicket.id);
      if (index !== -1) {
        this.tickets[index] = { ...this.selectedTicket };
      }
    } else {
      const newTicket: Ticket = {
        ...this.selectedTicket,
        id: Date.now(),
        createdAt: new Date().toLocaleDateString('es-MX')
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

  clearFilters(): void {
    this.filterStatus = '';
    this.filterPriority = '';
    this.searchText = '';
  }
}
