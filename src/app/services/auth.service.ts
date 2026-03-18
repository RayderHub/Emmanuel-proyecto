import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionService } from './permission.service';

const USERS: {
  username: string;
  password: string;
  displayName: string;
  permissions: string[];
}[] = [
    {
      username: 'usuario',
      password: 'user123',
      displayName: 'Usuario',
      permissions: [
        'nav.home',
        'nav.profile'
      ]
    },
    {
      username: 'superusuario',
      password: 'super123',
      displayName: 'Super Usuario',
      permissions: [
        'nav.hom+e',
        'nav.profile',
        'nav.groups',
        'nav.tickets',
        'group.create',
        'group.edit',
        'group.delete'
      ]
    }
  ];

const STORAGE_KEY = 'app_current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private permissionService: PermissionService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  login(username: string, password: string): boolean {
    const found = USERS.find(
      u => u.username === username && u.password === password
    );

    if (!found) return false;

    // Guardar sesión en localStorage (solo disponible en browser)
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        username: found.username,
        displayName: found.displayName,
        permissions: found.permissions
      }));
    }

    // Cargar permisos en el servicio
    this.permissionService.setPermissions(found.permissions);
    return true;
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.permissionService.clearPermissions();
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(STORAGE_KEY);
  }

  getCurrentUser(): { username: string; displayName: string; permissions: string[] } | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /** Restaura la sesión al recargar la página */
  private restoreSession(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.permissionService.setPermissions(user.permissions);
    }
  }
}