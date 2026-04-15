import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PermissionService } from './permission.service';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

const USER_COOKIE = 'erp_user';
const API_URL = environment.apiUrl; // API Gateway route

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser: boolean;

  // Emails que tienen permisos de super-administrador adicionales
  private readonly SUPER_ADMIN_EMAILS = ['admin@marher.com'];

  constructor(
    private router: Router,
    private http: HttpClient,
    private permissionService: PermissionService,
    private cookieService: CookieService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${API_URL}/auth/login`, { email, password }).pipe(
      map((response) => {
        if (response.statusCode === 200 && response.data?.length > 0) {
          const token = response.data[0].token;
          const decoded = parseJwt(token);
          if (decoded) {
            const permissions: string[] = decoded.permissions || [];
            const groupPermissions = decoded.groupPermissions || {};
            
            // Populate groups map
            for (let groupId in groupPermissions) {
               this.permissionService.setGroupPermissions(groupId, groupPermissions[groupId]);
            }

            // Super-admin: garantizar que tenga TODAS las claves canónicas actuales
            if (this.SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
              const ALL_CANONICAL = [
                'pdf:add', 'pdf:move', 'pdf:groups', 'pdf:users',
                'user:edit-self', 'user:add', 'user:edit', 'user:delete',
                'group:view', 'group:add', 'group:edit', 'group:manage', 'group:delete',
                'ticket:view', 'ticket:add', 'ticket:edit',
                'ticket:move', 'ticket:delete'
              ];
              // Reemplazar todas las claves (incluyendo las que vienen del JWT)
              ALL_CANONICAL.forEach(p => { if (!permissions.includes(p)) permissions.push(p); });
            }

            const user = {
              userId: decoded.sub || decoded.userId || '',
              username: email,
              displayName: response.data[0].user.name || email.split('@')[0],
              permissions,
              token,
              role: decoded.role || response.data[0].user.role // Guardar el ROLE en la cookie
            };

            // ✅ Guardar token en cookie (requerimiento del PDF)
            this.cookieService.set(USER_COOKIE, JSON.stringify(user), 7);
            this.permissionService.setPermissions(permissions);
            this.permissionService.setRole(user.role || 'user'); // Suministrar Rol al PermissionService
            return true;
          }
        }
        return false;
      }),
      catchError((err) => {
        console.error('Login error', err);
        return of(false);
      })
    );
  }

  // ─── Register ────────────────────────────────────────────────────────────

  register(
    email: string,
    password: string,
    extraData: any
  ): Observable<{ ok: boolean; message: string }> {
    // Enviamos TODO el objeto extraData al servidor
    return this.http.post<any>(`${API_URL}/auth/register`, { 
      email, 
      password, 
      ...extraData 
    }).pipe(
      map((response) => {
         if (response.statusCode === 200) {
            return { ok: true, message: 'Registro exitoso. Puedes iniciar sesión ahora.' };
         }
         return { ok: false, message: response.message || 'Error al registrar' };
      }),
      catchError((err) => {
        const msg = err?.error?.message || 'Error al registrar. Intenta de nuevo.';
        return of({ ok: false, message: msg });
      })
    );
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  logout(): void {
    this.cookieService.delete(USER_COOKIE);
    this.permissionService.clearPermissions();
    this.router.navigate(['/auth/login']);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!this.cookieService.get(USER_COOKIE);
  }

  getCurrentUser(): {
    userId: string;
    username: string;
    displayName: string;
    permissions: string[];
    token?: string;
    role?: string;
  } | null {
    if (!this.isBrowser) return null;
    const raw = this.cookieService.get(USER_COOKIE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private restoreSession(): void {
    const user = this.getCurrentUser();
    if (user) {
      if (user.token) {
        const decoded = parseJwt(user.token);
        if (decoded && decoded.groupPermissions) {
          for (let groupId in decoded.groupPermissions) {
            this.permissionService.setGroupPermissions(groupId, decoded.groupPermissions[groupId]);
          }
        }
      }
      // Leer permisos tal cual están en la cookie.
      // La inyección de ALL_CANONICAL para admin ocurre SOLO en login(),
      // no aquí — de lo contrario, cualquier edición de permisos del admin
      // se revertiría en cada recarga de página.
      this.permissionService.setPermissions(user.permissions || []);
      if (user.role) {
        this.permissionService.setRole(user.role);
      }
    }
  }

  /**
   * Refresca los permisos del usuario actualmente logueado en memoria y cookie
   * sin necesidad de hacer re-login. Útil después de que un admin guarda
   * sus propios permisos desde la pantalla de gestión de usuarios.
   */
  refreshCurrentUserPermissions(userId: string, newPermissions: string[]): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.userId !== userId) return;
    // Actualizar cookie
    const updatedUser = { ...currentUser, permissions: newPermissions };
    this.cookieService.set(USER_COOKIE, JSON.stringify(updatedUser), 7);
    // Actualizar permissionService en caliente (sin re-login)
    this.permissionService.setPermissions(newPermissions);
  }
}