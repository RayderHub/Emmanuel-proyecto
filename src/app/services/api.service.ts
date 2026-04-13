import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ─── Helpers para estandarizar respuestas ────────────────────────────────
  private async get<T>(path: string): Promise<T> {
    const res = await firstValueFrom(this.http.get<any>(`${API_URL}${path}`));
    return res.data;
  }

  private async post<T>(path: string, body: any): Promise<T> {
    const res = await firstValueFrom(this.http.post<any>(`${API_URL}${path}`, body));
    return res.data && res.data.length > 0 ? res.data[0] : res.data;
  }

  private async patch<T>(path: string, body: any): Promise<T> {
    const res = await firstValueFrom(this.http.patch<any>(`${API_URL}${path}`, body));
    return res.data && res.data.length > 0 ? res.data[0] : res.data;
  }

  private async delete<T>(path: string): Promise<T> {
    const res = await firstValueFrom(this.http.delete<any>(`${API_URL}${path}`));
    return res.data;
  }

  // ─── Auth / Register ─────────────────────────────────────────────────────

  async register(
    email: string,
    password: string,
    extraData: { username: string; fullName: string; phone?: string; address?: string }
  ) {
    const res = await firstValueFrom(this.http.post<any>(`${API_URL}/auth/register`, { email, password, fullName: extraData.fullName }));
    return res.data[0];
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────

  async getUsers() {
    return this.get<any[]>('/users');
  }

  async createUser(user: any) {
    return this.post<any>('/users', user);
  }

  async updateUser(id: any, user: any) {
    return this.patch<any>(`/users/${id}`, user);
  }

  async deleteUser(id: any) {
    return this.delete<any>(`/users/${id}`);
  }

  // ─── Estudiantes (Mocked in memory to avoid breaking prior views) ─────────
  private studentsMock: any[] = [];
  async getStudents() { return this.studentsMock; }
  async createStudent(student: any) { this.studentsMock.push({ id: Date.now(), ...student }); return student; }
  async updateStudent(id: number, student: any) { return student; }
  async deleteStudent(id: number) { this.studentsMock = this.studentsMock.filter(s => s.id !== id); }

  // ─── Grupos ───────────────────────────────────────────────────────────────

  async getGroups() {
    return this.get<any[]>('/groups');
  }

  async createGroup(group: any) {
    return this.post<any>('/groups', group);
  }

  async updateGroup(id: number, group: any) {
    return this.patch<any>(`/groups/${id}`, group);
  }

  async deleteGroup(id: number) {
    return this.delete<any>(`/groups/${id}`);
  }

  // ─── Miembros de Grupo (group_members) ───────────────────────────────────

  async getGroupMembers(groupId: number) {
    return this.get<any[]>(`/groups/${groupId}/users`);
  }

  async getUserGroups(userId: string) {
    return this.get<any[]>(`/users/${userId}/groups`);
  }

  async addUserToGroup(userId: string, groupId: number) {
    return this.post<any>(`/groups/${groupId}/users`, { userId });
  }

  async removeUserFromGroup(userId: string, groupId: number) {
    return this.delete<any>(`/groups/${groupId}/users/${userId}`);
  }

  // ─── Permisos por Grupo (group_permissions) ───────────────────────────────

  async getGroupPermissions(userId: string, groupId: number): Promise<string[]> {
    return this.get<string[]>(`/groups/${groupId}/users/${userId}/permissions`);
  }

  async setGroupPermissions(userId: string, groupId: number, permissions: string[]) {
    return this.patch<any>(`/groups/${groupId}/users/${userId}/permissions`, { permissions });
  }

  async getAllGroupPermissionsForGroup(groupId: number) {
    return this.get<any[]>(`/groups/${groupId}/permissions`);
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async getTickets() {
    return this.get<any[]>('/tickets');
  }

  async getTicketsByGroup(groupId: number) {
    return this.get<any[]>(`/tickets?groupId=${groupId}`);
  }

  async createTicket(ticket: any) {
    return this.post<any>('/tickets', ticket);
  }

  async updateTicket(id: number, ticket: any) {
    return this.patch<any>(`/tickets/${id}`, ticket);
  }

  async deleteTicket(id: number) {
    return this.delete<any>(`/tickets/${id}`);
  }

  // ─── Stats para Dashboard ─────────────────────────────────────────────────

  async getTicketStats() {
    const tickets = await this.getTickets();
    return {
      total: tickets.length,
      byStatus: {
        pendiente: tickets.filter((t) => t.status === 'pendiente' || t.status === 'To-Do').length,
        'en-proceso': tickets.filter((t) => t.status === 'en-proceso' || t.status === 'In Progress').length,
        revision: tickets.filter((t) => t.status === 'revision').length,
        finalizado: tickets.filter((t) => t.status === 'finalizado' || t.status === 'Done').length,
      },
      byPriority: {
        baja: tickets.filter((t) => t.priority === 'baja' || t.priority === 'Low').length,
        media: tickets.filter((t) => t.priority === 'media' || t.priority === 'Medium').length,
        alta: tickets.filter((t) => t.priority === 'alta' || t.priority === 'High').length,
        urgente: tickets.filter((t) => t.priority === 'urgente' || t.priority === 'Urgent').length,
      },
    };
  }
}
