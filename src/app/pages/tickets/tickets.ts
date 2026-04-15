import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'pendiente' | 'en-proceso' | 'revision' | 'finalizado';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  assignedTo?: string;
  assignedToId?: string;
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
  users: any[] = [];
  isLoading: boolean = false;  // ← spinner de carga inicial
  isSaving: boolean = false;   // ← bloquea el botón guardar

  constructor(private supabase: ApiService) {}

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    this.isLoading = true;
    try {
      // Peticiones en paralelo: tickets y usuarios al mismo tiempo
      const [tickets, users] = await Promise.all([
        this.supabase.getTickets(),
        this.supabase.getUsers()
      ]);
      this.tickets = tickets || [];
      this.users   = users   || [];
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
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
          (t.assignedTo || '').toLowerCase().includes(this.searchText.toLowerCase())
        : true;
      return matchStatus && matchPriority && matchSearch;
    });
  }

  get totalCount(): number { return this.tickets.length; }
  get pendienteCount(): number { return this.tickets.filter(t => t.status === 'pendiente').length; }
  get enProcesoCount(): number { return this.tickets.filter(t => t.status === 'en-proceso').length; }
  get finalizadoCount(): number { return this.tickets.filter(t => t.status === 'finalizado').length; }

  /** Devuelve el nombre del usuario asignado, o 'Sin asignar' si no hay ninguno */
  getUserName(userId: string | undefined): string {
    if (!userId) return 'Sin asignar';
    const user = this.users.find(u => u.id === userId);
    return user ? (user.fullName || user.username || userId) : userId;
  }

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
    if (this.isSaving) return;  // bloqueo anti-doble-click
    this.isSaving = true;
    this.displayTicketDialog = false; // cerrar dialog inmediatamente
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
    } finally {
      this.isSaving = false;
      this.selectedTicket = this.createEmptyTicket();
    }
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
