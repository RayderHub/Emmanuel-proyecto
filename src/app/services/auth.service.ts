import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly validUser = {
    username: 'job',
    password: '1234abcd#'
  };

  private isAuthenticated = false;

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  login(username: string, password: string): boolean {
    if (username === this.validUser.username && password === this.validUser.password) {
      this.isAuthenticated = true;
      this.messageService.add({
        severity: 'success',
        summary: 'Login exitoso',
        detail: 'Bienvenido de vuelta!'
      });
      return true;
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error de login',
      detail: 'Usuario o contraseña incorrectos'
    });
    return false;
  }

  logout(): void {
    this.isAuthenticated = false;
    this.router.navigate(['/auth/login']);
    this.messageService.add({
      severity: 'info',
      summary: 'Sesión cerrada',
      detail: 'Has cerrado sesión correctamente'
    });
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getUsername(): string {
    return this.isAuthenticated ? this.validUser.username : '';
  }
}