import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import { Sidebar } from '../../../components/sidebar/sidebar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    Sidebar,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FormsModule,
    CommonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username: string = '';
  password: string = '';
  loginError: boolean = false;
  loading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  onLogin(): void {
    if (!this.username || !this.password) return;

    this.loading = true;
    this.loginError = false;

    // Pequeño delay para dar sensación de proceso
    setTimeout(() => {
      const ok = this.authService.login(this.username.trim(), this.password);

      if (ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: `Sesión iniciada correctamente`
        });
        setTimeout(() => this.router.navigate(['/']), 800);
      } else {
        this.loginError = true;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Credenciales inválidas',
          detail: 'El usuario o la contraseña son incorrectos'
        });
      }
    }, 400);
  }
}
