import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Sidebar } from '../../components/sidebar/sidebar';
import { ApiService } from '../../services/api.service';

interface GroupData {
  id: number;
  name: string;
  description: string;
  course: string;
  semester: string;
  createdAt: string;
  studentCount: number;
}

interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
}

/** Permisos disponibles por grupo (definidos en el PDF) */
const GROUP_PERMISSIONS: { key: string; label: string }[] = [
  { key: 'ticket:add',  label: 'Agregar tickets' },
  { key: 'ticket:move', label: 'Mover estado de tickets' },
  { key: 'ticket:view', label: 'Ver tickets' },
  { key: 'ticket:edit', label: 'Editar tickets' },
  { key: 'ticket:delete', label: 'Eliminar tickets' },
  { key: 'group:manage', label: 'Gestionar grupos' },
  { key: 'group:view',  label: 'Ver grupos' },
  { key: 'user:manage', label: 'Gestionar usuarios' },
];

@Component({
  selector: 'app-admin-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TagModule,
    CheckboxModule,
    ToastModule,
    Sidebar,
  ],
  providers: [MessageService],
  templateUrl: './admin-group.html',
  styleUrl: './admin-group.css',
})
export class AdminGroup implements OnInit {
  groups: GroupData[] = [];
  allUsers: AppUser[] = [];
  allPermissions = GROUP_PERMISSIONS;

  // ── Dialogs ──────────────────────────────────────────────
  showGroupDialog = false;
  groupEditMode = false;
  selectedGroup: Partial<GroupData> = {};

  showMembersDialog = false;
  currentGroup: GroupData | null = null;
  groupMembers: any[] = [];
  groupPermsMap: Record<string, Set<string>> = {}; // userId → perms

  showAddMemberDialog = false;
  selectedUserId = '';

  showDeleteDialog = false;
  deleteTarget: GroupData | null = null;

  loading = false;
  isSaving = false; // ← bloquea botones durante operaciones

  constructor(
    private supabase: ApiService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // Peticiones en paralelo: grupos y usuarios al mismo tiempo
      const [groups, users] = await Promise.all([
        this.supabase.getGroups(),
        this.supabase.getUsers()
      ]);
      this.groups   = groups;
      this.allUsers = users as AppUser[];
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  // ── CRUD de Grupos ───────────────────────────────────────

  openAddGroup() {
    this.selectedGroup = {};
    this.groupEditMode = false;
    this.showGroupDialog = true;
  }

  openEditGroup(group: GroupData) {
    this.selectedGroup = { ...group };
    this.groupEditMode = true;
    this.showGroupDialog = true;
  }

  async saveGroup() {
    if (!this.selectedGroup.name || this.isSaving) return;
    this.isSaving = true;
    this.showGroupDialog = false; // cerrar inmediatamente
    try {
      if (this.groupEditMode && this.selectedGroup.id) {
        await this.supabase.updateGroup(this.selectedGroup.id, this.selectedGroup);
        this.toast('Grupo actualizado', 'success');
      } else {
        await this.supabase.createGroup(this.selectedGroup);
        this.toast('Grupo creado', 'success');
      }
      await this.loadData();
    } catch (e: any) {
      this.toast(e.message || 'Error al guardar', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  askDelete(group: GroupData) {
    this.deleteTarget = group;
    this.showDeleteDialog = true;
  }

  async confirmDelete() {
    if (!this.deleteTarget) return;
    try {
      await this.supabase.deleteGroup(this.deleteTarget.id);
      this.toast('Grupo eliminado', 'success');
      await this.loadData();
    } catch (e: any) {
      this.toast(e.message || 'Error al eliminar', 'error');
    }
    this.showDeleteDialog = false;
    this.deleteTarget = null;
  }

  // ── Gestión de Miembros y Permisos por Grupo ────────────

  async openMembers(group: GroupData) {
    this.currentGroup = group;
    this.showMembersDialog = true;
    await this.loadGroupMembers(group.id);
  }

  async loadGroupMembers(groupId: number) {
    try {
      this.groupMembers = await this.supabase.getGroupMembers(groupId);
      // Cargar permisos por usuario para este grupo
      this.groupPermsMap = {};
      for (const member of this.groupMembers) {
        const userId = member.user_id;
        const perms = await this.supabase.getGroupPermissions(userId, groupId);
        this.groupPermsMap[userId] = new Set(perms);
      }
    } catch (e) {
      console.error(e);
    }
  }

  hasPerm(userId: string, perm: string): boolean {
    return this.groupPermsMap[userId]?.has(perm) ?? false;
  }

  togglePerm(userId: string, perm: string) {
    if (!this.groupPermsMap[userId]) this.groupPermsMap[userId] = new Set();
    if (this.groupPermsMap[userId].has(perm)) {
      this.groupPermsMap[userId].delete(perm);
    } else {
      this.groupPermsMap[userId].add(perm);
    }
  }

  async saveAllPerms() {
    if (!this.currentGroup) return;
    try {
      for (const userId of Object.keys(this.groupPermsMap)) {
        const perms = Array.from(this.groupPermsMap[userId]);
        await this.supabase.setGroupPermissions(userId, this.currentGroup.id, perms);
      }
      this.toast('Permisos guardados correctamente', 'success');
    } catch (e: any) {
      this.toast(e.message || 'Error al guardar permisos', 'error');
    }
  }

  async removeFromGroup(userId: string) {
    if (!this.currentGroup) return;
    try {
      await this.supabase.removeUserFromGroup(userId, this.currentGroup.id);
      await this.loadGroupMembers(this.currentGroup.id);
      this.toast('Usuario removido del grupo', 'success');
    } catch (e: any) {
      this.toast(e.message || 'Error', 'error');
    }
  }

  openAddMember() {
    this.selectedUserId = '';
    this.showAddMemberDialog = true;
  }

  async addMember() {
    if (!this.selectedUserId || !this.currentGroup || this.isSaving) return;
    this.isSaving = true;
    this.showAddMemberDialog = false; // cerrar inmediatamente
    try {
      await this.supabase.addUserToGroup(this.selectedUserId, this.currentGroup.id);
      await this.loadGroupMembers(this.currentGroup.id);
      this.toast('Usuario añadido al grupo', 'success');
    } catch (e: any) {
      this.toast(e.message || 'Error al añadir', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  getUserName(userId: string): string {
    const u = this.allUsers.find((u) => u.id === userId);
    return u ? (u.fullName || u.username) : userId;
  }

  get nonMemberUsers(): AppUser[] {
    const memberIds = new Set(this.groupMembers.map((m) => m.user_id));
    return this.allUsers.filter((u) => !memberIds.has(u.id));
  }

  private toast(detail: string, severity: 'success' | 'error' | 'warn') {
    this.messageService.add({ severity, summary: severity === 'success' ? 'OK' : 'Error', detail });
  }
}
