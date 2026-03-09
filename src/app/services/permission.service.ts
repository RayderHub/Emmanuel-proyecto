import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissions: Set<string> = new Set();

  setPermissions(permissions: string[]): void {
    this.permissions = new Set(permissions);
  }

  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }

  getPermissions(): string[] {
    return Array.from(this.permissions);
  }

  clearPermissions(): void {
    this.permissions.clear();
  }

  addPermission(permission: string): void {
    this.permissions.add(permission);
  }

  removePermission(permission: string): void {
    this.permissions.delete(permission);
  }
}