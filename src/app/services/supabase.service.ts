import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private mapDbUser(dbUser: any) {
    return {
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.full_name,
      role: dbUser.role,
      email: dbUser.email || (dbUser.username ? dbUser.username + '@app.com' : ''),
      permissions: dbUser.permissions || [],
    };
  }

  private mapDbStudent(dbStudent: any) {
    return {
      ...dbStudent,
      fullName: dbStudent.full_name,
      birthDate: dbStudent.birth_date,
    };
  }

  private mapDbGroup(dbGroup: any) {
    return {
      ...dbGroup,
      createdAt: dbGroup.created_at,
      studentCount: 0,
    };
  }

  private mapDbTicket(dbTicket: any) {
    return {
      ...dbTicket,
      assignedTo: dbTicket.users?.full_name || dbTicket.users?.username || dbTicket.assigned_to,
      assignedToId: dbTicket.assigned_to,
      dueDate: dbTicket.due_date,
      createdAt: dbTicket.created_at,
      groupId: dbTicket.group_id,
    };
  }

  // ─── Auth / Register ─────────────────────────────────────────────────────

  async register(
    email: string,
    password: string,
    extraData: { username: string; fullName: string; phone?: string; address?: string }
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: extraData.username,
          full_name: extraData.fullName,
          phone: extraData.phone,
          address: extraData.address,
        },
      },
    });
    if (error) throw error;
    return data.user;
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────

  async getUsers() {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) throw error;
    return data?.map(this.mapDbUser) || [];
  }

  async createUser(user: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email: user.email,
      password: user.password || 'Temporal123!',
      options: {
        data: {
          username: user.username,
          full_name: user.fullName,
          role: user.role,
        },
      },
    });
    if (error) throw error;
    return {
      id: data.user?.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      permissions: [],
    };
  }

  async updateUser(id: any, user: any) {
    const payload: any = {};
    if (user.username !== undefined) payload.username = user.username;
    if (user.fullName !== undefined) payload.full_name = user.fullName;
    if (user.role !== undefined) payload.role = user.role;
    if (user.permissions !== undefined) payload.permissions = user.permissions;
    const { data, error } = await this.supabase.from('users').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbUser(data[0]) : null;
  }

  async deleteUser(id: any) {
    const { error } = await this.supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Estudiantes ──────────────────────────────────────────────────────────

  async getStudents() {
    const { data, error } = await this.supabase.from('students').select('*');
    if (error) throw error;
    return data?.map(this.mapDbStudent) || [];
  }

  async createStudent(student: any) {
    const payload = {
      username: student.username,
      email: student.email,
      full_name: student.fullName,
      birth_date: student.birthDate,
      address: student.address,
      phone: student.phone,
    };
    const { data, error } = await this.supabase.from('students').insert([payload]).select();
    if (error) throw error;
    return data ? this.mapDbStudent(data[0]) : null;
  }

  async updateStudent(id: number, student: any) {
    const payload: any = {
      username: student.username,
      email: student.email,
      full_name: student.fullName,
      birth_date: student.birthDate,
      address: student.address,
      phone: student.phone,
    };
    const { data, error } = await this.supabase.from('students').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbStudent(data[0]) : null;
  }

  async deleteStudent(id: number) {
    const { error } = await this.supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Grupos ───────────────────────────────────────────────────────────────

  async getGroups() {
    const { data, error } = await this.supabase.from('groups').select('*');
    if (error) throw error;
    return data?.map(this.mapDbGroup) || [];
  }

  async createGroup(group: any) {
    const payload = {
      name: group.name,
      description: group.description,
      course: group.course,
      semester: group.semester,
    };
    const { data, error } = await this.supabase.from('groups').insert([payload]).select();
    if (error) throw error;
    return data ? this.mapDbGroup(data[0]) : null;
  }

  async updateGroup(id: number, group: any) {
    const payload = {
      name: group.name,
      description: group.description,
      course: group.course,
      semester: group.semester,
    };
    const { data, error } = await this.supabase.from('groups').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbGroup(data[0]) : null;
  }

  async deleteGroup(id: number) {
    const { error } = await this.supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Miembros de Grupo (group_members) ───────────────────────────────────

  async getGroupMembers(groupId: number) {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('*, users(id, username, full_name, email, role)')
      .eq('group_id', groupId);
    if (error) throw error;
    return data || [];
  }

  async getUserGroups(userId: string) {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('*, groups(id, name, description, course, semester, created_at)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row: any) => this.mapDbGroup(row.groups));
  }

  async addUserToGroup(userId: string, groupId: number) {
    const { error } = await this.supabase
      .from('group_members')
      .insert([{ user_id: userId, group_id: groupId }]);
    if (error) throw error;
  }

  async removeUserFromGroup(userId: string, groupId: number) {
    const { error } = await this.supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId);
    if (error) throw error;
  }

  // ─── Permisos por Grupo (group_permissions) ───────────────────────────────

  async getGroupPermissions(userId: string, groupId: number): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('group_permissions')
      .select('permission')
      .eq('user_id', userId)
      .eq('group_id', groupId);
    if (error) throw error;
    return (data || []).map((row: any) => row.permission);
  }

  async setGroupPermissions(userId: string, groupId: number, permissions: string[]) {
    // Elimina los permisos anteriores y re-inserta
    const { error: delError } = await this.supabase
      .from('group_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId);
    if (delError) throw delError;

    if (permissions.length === 0) return;

    const rows = permissions.map((permission) => ({
      user_id: userId,
      group_id: groupId,
      permission,
    }));

    const { error } = await this.supabase.from('group_permissions').insert(rows);
    if (error) throw error;
  }

  async getAllGroupPermissionsForGroup(groupId: number) {
    const { data, error } = await this.supabase
      .from('group_permissions')
      .select('*, users(id, username, full_name)')
      .eq('group_id', groupId);
    if (error) throw error;
    return data || [];
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async getTickets() {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*, users(full_name, username)');
    if (error) throw error;
    return (data || []).map((t) => this.mapDbTicket(t));
  }

  async getTicketsByGroup(groupId: number) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*, users(full_name, username)')
      .eq('group_id', groupId);
    if (error) throw error;
    return (data || []).map((t) => this.mapDbTicket(t));
  }

  async createTicket(ticket: any) {
    const payload = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assignedToId || null,
      due_date: ticket.dueDate || null,
      group_id: ticket.groupId || null,
    };
    const { data, error } = await this.supabase.from('tickets').insert([payload]).select();
    if (error) throw error;
    return data ? this.mapDbTicket(data[0]) : null;
  }

  async updateTicket(id: number, ticket: any) {
    const payload: any = {};
    if (ticket.title !== undefined) payload.title = ticket.title;
    if (ticket.description !== undefined) payload.description = ticket.description;
    if (ticket.status !== undefined) payload.status = ticket.status;
    if (ticket.priority !== undefined) payload.priority = ticket.priority;
    if (ticket.assignedToId !== undefined) payload.assigned_to = ticket.assignedToId || null;
    if (ticket.dueDate !== undefined) payload.due_date = ticket.dueDate || null;
    if (ticket.groupId !== undefined) payload.group_id = ticket.groupId || null;
    const { data, error } = await this.supabase.from('tickets').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbTicket(data[0]) : null;
  }

  async deleteTicket(id: number) {
    const { error } = await this.supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Stats para Dashboard ─────────────────────────────────────────────────

  async getTicketStats() {
    const { data, error } = await this.supabase.from('tickets').select('status, priority, group_id');
    if (error) throw error;
    const tickets = data || [];
    return {
      total: tickets.length,
      byStatus: {
        pendiente: tickets.filter((t) => t.status === 'pendiente').length,
        'en-proceso': tickets.filter((t) => t.status === 'en-proceso').length,
        revision: tickets.filter((t) => t.status === 'revision').length,
        finalizado: tickets.filter((t) => t.status === 'finalizado').length,
      },
      byPriority: {
        baja: tickets.filter((t) => t.priority === 'baja').length,
        media: tickets.filter((t) => t.priority === 'media').length,
        alta: tickets.filter((t) => t.priority === 'alta').length,
        urgente: tickets.filter((t) => t.priority === 'urgente').length,
      },
    };
  }
}
