import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

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

  tickets: Ticket[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    try {
      this.tickets = await this.supabase.getTickets() || [];
    } catch (e) {
      console.error(e);
    }
  }

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

  async deleteTicket() {
    if (this.ticketToDeleteId !== null) {
      try {
        await this.supabase.deleteTicket(this.ticketToDeleteId);
        await this.loadTickets();
      } catch(e) {
        console.error(e);
      }
      this.ticketToDeleteId = null;
    }
    this.displayDeleteConfirm = false;
  }

  cancelDelete(): void {
    this.ticketToDeleteId = null;
    this.displayDeleteConfirm = false;
  }

  async saveTicket() {
    try {
      if (this.ticketEditMode) {
        await this.supabase.updateTicket(this.selectedTicket.id, this.selectedTicket);
      } else {
        const newTicket = { ...this.selectedTicket };
        delete (newTicket as any).id; // Let DB generate ID
        await this.supabase.createTicket(newTicket);
      }
      await this.loadTickets();
    } catch (e) {
      console.error(e);
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
