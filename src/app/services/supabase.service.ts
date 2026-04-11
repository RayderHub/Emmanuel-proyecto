import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ============== USEFUL MAPPERS ==============
  private mapDbUser(dbUser: any) {
    return {
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.full_name,
      role: dbUser.role,
      email: dbUser.username ? dbUser.username + '@app.com' : '', // mock email si no se tiene
      permissions: dbUser.permissions || [] // Se lee de la tabla si existe
    };
  }

  private mapDbStudent(dbStudent: any) {
    return {
      ...dbStudent,
      fullName: dbStudent.full_name,
      birthDate: dbStudent.birth_date
    };
  }

  private mapDbGroup(dbGroup: any) {
    return {
      ...dbGroup,
      createdAt: dbGroup.created_at,
      studentCount: 0 // computado/mock por ahora
    };
  }

  private mapDbTicket(dbTicket: any) {
    return {
      ...dbTicket,
      assignedTo: dbTicket.assigned_to,
      dueDate: dbTicket.due_date,
      createdAt: dbTicket.created_at,
      groupId: dbTicket.group_id
    };
  }

  // --- Usuarios ---
  async getUsers() {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) throw error;
    return data?.map(this.mapDbUser) || [];
  }

  async createUser(user: any) {
    // En Supabase, para crear un usuario correctamente vinculado con auth,
    // debemos usar signUp. Pasamos los campos extras dentro de "options.data".
    // La base de datos, mediante el Trigger, interceptará esto y llenará la tabla public.users automáticamente.
    const { data, error } = await this.supabase.auth.signUp({
      email: user.email,
      password: user.password || 'Temporal123!', // Clave por defecto si no se ingresa
      options: {
        data: {
          username: user.username,
          full_name: user.fullName,
          role: user.role
        }
      }
    });
    
    if (error) throw error;
    
    // Retornamos el objeto parseado localmente sabiendo que el trigger ya lo insertó en DB
    return {
      id: data.user?.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      permissions: []
    };
  }

  async updateUser(id: any, user: any) {
    const payload: any = {};
    if (user.username) payload.username = user.username;
    if (user.fullName) payload.full_name = user.fullName;
    if (user.role) payload.role = user.role;
    if (user.permissions) payload.permissions = user.permissions;
    
    const { data, error } = await this.supabase.from('users').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbUser(data[0]) : null;
  }

  async deleteUser(id: any) {
    const { error } = await this.supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Estudiantes ---
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
      phone: student.phone
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
      phone: student.phone
    };
    const { data, error } = await this.supabase.from('students').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbStudent(data[0]) : null;
  }

  async deleteStudent(id: number) {
    const { error } = await this.supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Grupos ---
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
      semester: group.semester
      // created_at let the db handle it
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
      semester: group.semester
    };
    const { data, error } = await this.supabase.from('groups').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbGroup(data[0]) : null;
  }

  async deleteGroup(id: number) {
    const { error } = await this.supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Tickets ---
  async getTickets() {
    const { data, error } = await this.supabase.from('tickets').select('*');
    if (error) throw error;
    return data?.map(this.mapDbTicket) || [];
  }

  async createTicket(ticket: any) {
    const payload = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assignedTo || null,
      due_date: ticket.dueDate || null,
      group_id: ticket.groupId || null
    };
    const { data, error } = await this.supabase.from('tickets').insert([payload]).select();
    if (error) throw error;
    return data ? this.mapDbTicket(data[0]) : null;
  }

  async updateTicket(id: number, ticket: any) {
    const payload = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assignedTo || null,
      due_date: ticket.dueDate || null,
      group_id: ticket.groupId || null
    };
    const { data, error } = await this.supabase.from('tickets').update(payload).eq('id', id).select();
    if (error) throw error;
    return data ? this.mapDbTicket(data[0]) : null;
  }

  async deleteTicket(id: number) {
    const { error } = await this.supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
  }
}
