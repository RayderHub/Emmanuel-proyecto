import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PermissionService } from './permission.service';

const STORAGE_KEY = 'app_current_user';
const API_URL = 'https://spatial-delcine-devemma-edfc3f92.koyeb.app';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    private permissionService: PermissionService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  // Usuarios con permisos especiales de frontend (superAdmin)
  private readonly SUPER_ADMIN_EMAILS = ['admin@marher.com'];

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${API_URL}/login`, { email, password }).pipe(
      map(response => {
        if (response.statusCode === 200 && response.data && response.data.length > 0) {
          const token = response.data[0].token;
          const decoded = parseJwt(token);
          if (decoded) {
            const permissions: string[] = decoded.permissions || [];

            // Si el email es superAdmin, se le añade el permiso de gestión de usuarios
            if (this.SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
              if (!permissions.includes('user:management')) {
                permissions.push('user:management');
              }
            }

            const user = {
              username: email,
              displayName: email.split('@')[0],
              permissions,
              token: token
            };

            if (this.isBrowser) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            }

            this.permissionService.setPermissions(user.permissions);
            return true;
          }
        }
        return false;
      }),
      catchError(err => {
        console.error('Login error', err);
        return of(false);
      })
    );
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

  getCurrentUser(): { username: string; displayName: string; permissions: string[]; token?: string } | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
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