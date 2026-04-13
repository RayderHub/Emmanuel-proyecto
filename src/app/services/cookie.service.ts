import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  set(name: string, value: string, days: number = 7): void {
    if (!this.isBrowser) return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
  }

  get(name: string): string | null {
    if (!this.isBrowser) return null;
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='));
    return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
  }

  delete(name: string): void {
    if (!this.isBrowser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
