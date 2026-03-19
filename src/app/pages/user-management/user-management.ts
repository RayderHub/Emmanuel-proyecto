import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sidebar } from '../../components/sidebar/sidebar';

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

  // Usuarios de ejemplo (mock)
  users: AppUser[] = [
    {
      id: 1, username: 'superadmin', email: 'superadmin@app.com',
      fullName: 'Super Administrador', role: 'superAdmin',
      permissions: [...SUPER_ADMIN_PERMISSIONS]
    },
    {
      id: 2, username: 'admin01', email: 'admin@app.com',
      fullName: 'Administrador Principal', role: 'Admin',
      permissions: ['group:view','group:add','group:edit','group:manage','group:delete',
                    'user:add','user:edit','user:manage','user:delete',
                    'ticket:view','ticket:add','ticket:edit','ticket:manage','ticket:delete']
    },
    {
      id: 3, username: 'pm_ana', email: 'ana@app.com',
      fullName: 'Ana López', role: 'PM',
      permissions: ['group:view','ticket:view','ticket:add','ticket:edit',
                    'ticket:edit:comment','ticket:edit:state','ticket:manage','user:edit:profile']
    },
    {
      id: 4, username: 'dev_carlos', email: 'carlos@app.com',
      fullName: 'Carlos Ramírez', role: 'Dev',
      permissions: ['group:view','ticket:view','ticket:edit:comment','ticket:edit:state','user:edit:profile']
    },
    {
      id: 5, username: 'soporte01', email: 'soporte@app.com',
      fullName: 'Laura Méndez', role: 'Support',
      permissions: ['ticket:view','ticket:edit:comment','user:edit:profile']
    }
  ];

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

  ngOnInit(): void {}

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

  saveUser(): void {
    if (!this.selectedUser.username || !this.selectedUser.email) return;
    if (this.editMode) {
      const idx = this.users.findIndex(u => u.id === this.selectedUser.id);
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...this.selectedUser } as AppUser;
      }
    } else {
      this.users.push({
        id: this.nextId++,
        username: this.selectedUser.username!,
        email: this.selectedUser.email!,
        fullName: this.selectedUser.fullName || '',
        role: this.selectedUser.role || 'Dev',
        permissions: []
      });
    }
    this.showUserDialog = false;
  }

  askDelete(user: AppUser): void {
    this.deleteTarget = user;
    this.showDeleteDialog = true;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.users = this.users.filter(u => u.id !== this.deleteTarget!.id);
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

  savePermissions(): void {
    if (!this.permUser) return;
    const idx = this.users.findIndex(u => u.id === this.permUser!.id);
    if (idx !== -1) {
      this.users[idx].permissions = Array.from(this.permEditing);
    }
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
