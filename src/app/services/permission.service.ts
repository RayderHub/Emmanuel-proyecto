import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  /** Permisos globales (del JWT al hacer login) */
  private basePermissions: Set<string> = new Set();

  /** Permisos activos = base + grupo actual */
  private permissions: Set<string> = new Set();
  
  /** Rol del usuario logueado para bypass de superadmin */
  private userRole: string = 'user';

  /** Permisos indexados por grupo (cargados desde Supabase al seleccionar grupo) */
  private groupPermissionsMap: Map<string, Set<string>> = new Map();

  /** ID del grupo actualmente seleccionado */
  private currentGroupId: string | null = null;

  // ─── Métodos requeridos por el PDF ───────────────────────────────────────

  /**
   * hasPermission(permission: string): boolean
   * Verifica si el usuario tiene el permiso en el contexto actual (global + grupo).
   */
  hasPermission(permission: string): boolean {
    if (this.userRole === 'admin') return true;
    return this.permissions.has(permission);
  }

  /**
   * refreshPermissionsForGroup(groupId: string): void
   * Cambia el contexto activo al grupo indicado y recalcula los permisos
   * combinando los permisos base (JWT) con los del grupo.
   */
  refreshPermissionsForGroup(groupId: string): void {
    this.currentGroupId = groupId;
    const groupPerms = this.groupPermissionsMap.get(groupId) ?? new Set<string>();
    this.permissions = new Set([...this.basePermissions, ...groupPerms]);
  }

  // ─── Métodos de apoyo ────────────────────────────────────────────────────

  /** Carga los permisos globales del JWT al hacer login */
  setPermissions(permissions: string[]): void {
    this.basePermissions = new Set(permissions);
    this.permissions = new Set(permissions);
  }

  /** Almacena el rol para bypass de UI */
  setRole(role: string): void {
    this.userRole = role;
  }

  /** Almacena los permisos para un grupo específico (sin activarlos todavía) */
  setGroupPermissions(groupId: string, permissions: string[]): void {
    this.groupPermissionsMap.set(groupId, new Set(permissions));
  }

  /** Devuelve los permisos activos actuales */
  getPermissions(): string[] {
    return Array.from(this.permissions);
  }

  /** ID del grupo activo */
  getCurrentGroupId(): string | null {
    return this.currentGroupId;
  }

  /** Limpia toda la sesión de permisos al hacer logout */
  clearPermissions(): void {
    this.basePermissions.clear();
    this.permissions.clear();
    this.groupPermissionsMap.clear();
    this.currentGroupId = null;
  }

  addPermission(permission: string): void {
    this.basePermissions.add(permission);
    this.permissions.add(permission);
  }

  removePermission(permission: string): void {
    this.basePermissions.delete(permission);
    this.permissions.delete(permission);
  }
}