import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sidebar } from '../../components/sidebar/sidebar';
import { SupabaseService } from '../../services/supabase.service';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

// Todos los permisos existentes en la app
export const ALL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  // Admin (exclusivo superAdmin)
  { key: 'user:management',        label: 'Gestión de usuarios',    group: 'Admin' },
  // Usuario
  { key: 'user:edit:profile', label: 'Editar propio perfil',  group: 'Usuario' },
  { key: 'user:add',          label: 'Agregar usuario',        group: 'Usuario' },
  { key: 'user:edit',         label: 'Editar usuario',         group: 'Usuario' },
  { key: 'user:manage',       label: 'Gestionar usuario',      group: 'Usuario' },
  { key: 'user:delete',       label: 'Eliminar usuario',       group: 'Usuario' },
  // Grupo
  { key: 'group:view',        label: 'Ver grupos',             group: 'Grupo' },
  { key: 'group:add',         label: 'Agregar grupo',          group: 'Grupo' },
  { key: 'group:edit',        label: 'Editar grupo',           group: 'Grupo' },
  { key: 'group:manage',      label: 'Gestionar grupo',        group: 'Grupo' },
  { key: 'group:delete',      label: 'Eliminar grupo',         group: 'Grupo' },
  // Ticket
  { key: 'ticket:view',            label: 'Ver tickets',            group: 'Ticket' },
  { key: 'ticket:add',             label: 'Agregar ticket',         group: 'Ticket' },
  { key: 'ticket:edit',            label: 'Editar ticket',          group: 'Ticket' },
  { key: 'ticket:edit:comment',    label: 'Comentar ticket',        group: 'Ticket' },
  { key: 'ticket:edit:state',      label: 'Cambiar estado ticket',  group: 'Ticket' },
  { key: 'ticket:manage',          label: 'Gestionar ticket',       group: 'Ticket' },
  { key: 'ticket:delete',          label: 'Eliminar ticket',        group: 'Ticket' },
];

const SUPER_ADMIN_PERMISSIONS = ALL_PERMISSIONS.map(p => p.key);

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, Sidebar],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

  allPermissions = ALL_PERMISSIONS;

  // Usuarios (desde Supabase)
  users: AppUser[] = [];

  constructor(private supabase: SupabaseService) {}

  // ---- CRUD dialog ----
  showUserDialog = false;
  editMode = false;
  selectedUser: Partial<AppUser> = {};

  // ---- Permissions dialog ----
  showPermDialog = false;
  permUser: AppUser | null = null;
  permEditing: Set<string> = new Set();

  // ---- Delete dialog ----
  showDeleteDialog = false;
  deleteTarget: AppUser | null = null;

  nextId = 6;

  // Permission groups helper
  permGroups(): string[] {
    return [...new Set(this.allPermissions.map(p => p.group))];
  }

  permsByGroup(group: string) {
    return this.allPermissions.filter(p => p.group === group);
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.supabase.getUsers() || [];
    } catch(e) { console.error(e); }
  }

  // ---- CRUD ----

  openAddUser(): void {
    this.editMode = false;
    this.selectedUser = { permissions: [] };
    this.showUserDialog = true;
  }

  openEditUser(user: AppUser): void {
    this.editMode = true;
    this.selectedUser = { ...user };
    this.showUserDialog = true;
  }

  async saveUser() {
    if (!this.selectedUser.username || !this.selectedUser.email) return;
    try {
      if (this.editMode) {
        await this.supabase.updateUser(this.selectedUser.id!, this.selectedUser);
      } else {
        const newUser: any = {
          username: this.selectedUser.username,
          email: this.selectedUser.email,
          fullName: this.selectedUser.fullName || '',
          role: this.selectedUser.role || 'Dev',
          permissions: [] // default permissions
        };
        await this.supabase.createUser(newUser);
      }
      await this.loadUsers();
    } catch(e) { console.error(e); }
    this.showUserDialog = false;
  }

  askDelete(user: AppUser): void {
    this.deleteTarget = user;
    this.showDeleteDialog = true;
  }

  async confirmDelete() {
    if (!this.deleteTarget) return;
    try {
      await this.supabase.deleteUser(this.deleteTarget.id);
      await this.loadUsers();
    } catch(e) { console.error(e); }
    this.showDeleteDialog = false;
    this.deleteTarget = null;
  }

  // ---- Permission management ----

  openPermissions(user: AppUser): void {
    this.permUser = user;
    this.permEditing = new Set(user.permissions);
    this.showPermDialog = true;
  }

  hasPerm(key: string): boolean {
    return this.permEditing.has(key);
  }

  togglePerm(key: string): void {
    if (this.permEditing.has(key)) {
      this.permEditing.delete(key);
    } else {
      this.permEditing.add(key);
    }
  }

  grantAll(): void {
    this.allPermissions.forEach(p => this.permEditing.add(p.key));
  }

  revokeAll(): void {
    this.permEditing.clear();
  }

  async savePermissions() {
    if (!this.permUser) return;
    try {
      const permsArray = Array.from(this.permEditing);
      await this.supabase.updateUser(this.permUser.id, { permissions: permsArray });
      await this.loadUsers();
    } catch(e) { console.error(e); }
    this.showPermDialog = false;
  }

  // Utilidades UI
  permCount(user: AppUser): number {
    return user.permissions.length;
  }

  superAdminCount(): number {
    return this.users.filter(u => u.role === 'superAdmin').length;
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      superAdmin: 'role-super',
      Admin: 'role-admin',
      PM: 'role-pm',
      Dev: 'role-dev',
      Support: 'role-support'
    };
    return map[role] ?? 'role-dev';
  }
}
