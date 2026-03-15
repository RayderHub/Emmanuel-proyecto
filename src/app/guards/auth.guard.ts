import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/**
 * Guarda de autenticación general.
 * Redirige al login si no hay sesión activa.
 * En SSR (servidor) siempre deja pasar para evitar errores de localStorage.
 */
export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // En SSR no bloqueamos — el guarda real actúa solo en el browser
  if (!isPlatformBrowser(platformId)) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};

/**
 * Guarda de permiso.
 * Uso: canActivate: [permissionGuard('nav.groups')]
 * Si el usuario no tiene el permiso, redirige al inicio.
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const platformId = inject(PLATFORM_ID);

    // En SSR dejamos pasar
    if (!isPlatformBrowser(platformId)) return true;

    const auth = inject(AuthService);
    const permService = inject(PermissionService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (!permService.hasPermission(permission)) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
}
