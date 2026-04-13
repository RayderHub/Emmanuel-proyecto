import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PermissionService } from './permission.service';
import { CookieService } from './cookie.service';
import { SupabaseService } from './supabase.service';

const USER_COOKIE = 'erp_user';
const API_URL = 'https://spatial-delcine-devemma-edfc3f92.koyeb.app';

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
    private supabaseService: SupabaseService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${API_URL}/login`, { email, password }).pipe(
      map((response) => {
        if (response.statusCode === 200 && response.data?.length > 0) {
          const token = response.data[0].token;
          const decoded = parseJwt(token);
          if (decoded) {
            const permissions: string[] = decoded.permissions || [];

            // Super-admin: agrega permiso de gestión de usuarios
            if (this.SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
              if (!permissions.includes('users:manage')) permissions.push('users:manage');
              if (!permissions.includes('groups:manage')) permissions.push('groups:manage');
            }

            const user = {
              userId: decoded.sub || decoded.userId || '',
              username: email,
              displayName: email.split('@')[0],
              permissions,
              token,
            };

            // ✅ Guardar token en cookie (requerimiento del PDF)
            this.cookieService.set(USER_COOKIE, JSON.stringify(user), 7);
            this.permissionService.setPermissions(permissions);
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
    extraData: { username: string; fullName: string; phone?: string; address?: string }
  ): Observable<{ ok: boolean; message: string }> {
    return from(this.supabaseService.register(email, password, extraData)).pipe(
      map((user) => ({
        ok: !!user,
        message: user ? 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.' : 'Error al registrar',
      })),
      catchError((err) => {
        const msg =
          err?.message?.includes('already registered')
            ? 'Este correo ya está registrado.'
            : err?.message || 'Error al registrar. Intenta de nuevo.';
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
      this.permissionService.setPermissions(user.permissions);
    }
  }
}