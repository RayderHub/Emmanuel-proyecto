import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sidebar } from '../../components/sidebar/sidebar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface AppUser {
  id?: string | number;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
  permissions: string[];
  password?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}

// Todos los permisos del sistema — keys canónicos (deben coincidir
// exactamente con AUTH.SERVICE.TS → ALL_CANONICAL y USER-SERVICE.JS → ALL_PERMS)
export const ALL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  // ── PDF ──────────────────────────────────────────────────────────────────
  { key: 'pdf:add',        label: 'Agregar tickets (PDF)',      group: 'PDF'     },
  { key: 'pdf:move',       label: 'Mover estado ticket (PDF)',  group: 'PDF'     },
  { key: 'pdf:groups',     label: 'Gestionar grupos (PDF)',     group: 'PDF'     },
  { key: 'pdf:users',      label: 'Gestionar usuarios (PDF)',   group: 'PDF'     },
  // ── Usuario ───────────────────────────────────────────────────────────────
  { key: 'user:edit-self', label: 'Editar propio perfil',       group: 'Usuario' },
  { key: 'user:add',       label: 'Agregar usuario',            group: 'Usuario' },
  { key: 'user:edit',      label: 'Editar usuario',             group: 'Usuario' },
  { key: 'user:delete',    label: 'Eliminar usuario',           group: 'Usuario' },
  // ── Grupo ─────────────────────────────────────────────────────────────────
  { key: 'group:view',     label: 'Ver grupos',                 group: 'Grupo'   },
  { key: 'group:add',      label: 'Agregar grupo',              group: 'Grupo'   },
  { key: 'group:edit',     label: 'Editar grupo',               group: 'Grupo'   },
  { key: 'group:manage',   label: 'Gestionar grupo',            group: 'Grupo'   },
  { key: 'group:delete',   label: 'Eliminar grupo',             group: 'Grupo'   },
  // ── Ticket ────────────────────────────────────────────────────────────────
  { key: 'ticket:view',    label: 'Ver tickets',                group: 'Ticket'  },
  { key: 'ticket:add',     label: 'Agregar ticket',             group: 'Ticket'  },
  { key: 'ticket:edit',    label: 'Editar ticket',              group: 'Ticket'  },
  { key: 'ticket:move',    label: 'Cambiar estado ticket',      group: 'Ticket'  },
  { key: 'ticket:delete',  label: 'Eliminar ticket',            group: 'Ticket'  },
];

const SUPER_ADMIN_PERMISSIONS = ALL_PERMISSIONS.map(p => p.key);


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, Sidebar, ToastModule],
  providers: [MessageService],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

  allPermissions = ALL_PERMISSIONS;

  // Usuarios (desde Supabase)
  users: AppUser[] = [];

  constructor(
    private supabase: ApiService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  // ---- CRUD dialog ----
  showUserDialog = false;
  editMode = false;
  selectedUser: Partial<AppUser> = {};
  isLoading = false;  // ← spinner de carga
  isSaving = false;   // ← bloqueo anti-doble-click

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
    this.isLoading = true;
    try {
      this.users = await this.supabase.getUsers() || [];
    } catch(e) { console.error(e); } finally {
      this.isLoading = false;
    }
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
    if (!this.selectedUser.username || (!this.editMode && !this.selectedUser.password) || this.isSaving) return;
    this.isSaving = true;
    this.showUserDialog = false; // cerrar inmediatamente
    try {
      if (this.editMode) {
        await this.supabase.updateUser(this.selectedUser.id!, this.selectedUser);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente' });
      } else {
        const newUser: any = {
          email: this.selectedUser.username,
          password: this.selectedUser.password,
          fullName: this.selectedUser.fullName || '',
          phone: this.selectedUser.phone || '',
          address: this.selectedUser.address || '',
          birthDate: this.selectedUser.birthDate || '',
          role: this.selectedUser.role || 'user'
        };
        await this.supabase.createUser(newUser);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado exitosamente' });
      }
      await this.loadUsers();
    } catch(e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  askDelete(user: AppUser): void {
    this.deleteTarget = user;
    this.showDeleteDialog = true;
  }

  async confirmDelete() {
    if (!this.deleteTarget || this.isSaving) return;
    this.isSaving = true;
    this.showDeleteDialog = false; // cerrar inmediatamente
    try {
      await this.supabase.deleteUser(this.deleteTarget.id);
      this.messageService.add({ severity: 'success', summary: 'Usuario Eliminado', detail: 'El usuario fue eliminado' });
      await this.loadUsers();
    } catch(e) { 
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario' });
      console.error(e); 
    } finally {
      this.isSaving = false;
      this.deleteTarget = null;
    }
  }

  // ---- Permission management ----

  openPermissions(user: AppUser): void {
    this.permUser = user;
    // CORRECCIÓN: filtrar permisos del usuario para solo incluir
    // las claves que existen actualmente en allPermissions.
    // Evita que keys legacy ('tickets:add', 'groups:view', etc.) aparezcan
    // en el set y produzcan contadores imposibles como "23/21 activos".
    const validKeys = new Set(this.allPermissions.map(p => p.key));
    this.permEditing = new Set(
      (user.permissions || []).filter(p => validKeys.has(p))
    );
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
    if (!this.permUser || this.isSaving) return;
    this.isSaving = true;
    this.showPermDialog = false;
    try {
      const permsArray = Array.from(this.permEditing);
      await this.supabase.updateUser(this.permUser.id, { permissions: permsArray });
      // Refrescar permisos en caliente si el usuario que se guarda es el actual
      this.authService.refreshCurrentUserPermissions(
        String(this.permUser.id),
        permsArray
      );
      await this.loadUsers();
    } catch(e) {
      console.error('Error al guardar permisos:', e);
    } finally {
      this.isSaving = false;
    }
  }

  // Utilidades UI
  permCount(user: AppUser): number {
    // Contar solo permisos cuya clave existe en allPermissions (no keys legacy)
    const validKeys = new Set(this.allPermissions.map(p => p.key));
    return (user.permissions || []).filter(p => validKeys.has(p)).length;
  }

  superAdminCount(): number {
    return this.users.filter(u => u.role === 'superAdmin').length;
  }

  roleClass(role?: string): string {
    if (!role) return 'role-dev';
    const map: Record<string, string> = {
      superAdmin: 'role-super',
      Admin: 'role-admin',
      user: 'role-user',
      PM: 'role-pm',
      Dev: 'role-dev',
      Support: 'role-support'
    };
    return map[role] ?? 'role-dev';
  }
}
