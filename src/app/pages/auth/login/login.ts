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
  email: string = '';
  password: string = '';
  loginError: boolean = false;
  loading: boolean = false;

  // Easter egg: 5 clicks en el logo → alert 'catch u'
  private logoClickCount = 0;
  private logoClickTimer: any;

  onLogoClick(): void {
    this.logoClickCount++;
    clearTimeout(this.logoClickTimer);
    this.logoClickTimer = setTimeout(() => { this.logoClickCount = 0; }, 2000);
    if (this.logoClickCount >= 5) {
      this.logoClickCount = 0;
      alert('catch u');
    }
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  onLogin(): void {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.loginError = false;

    this.authService.login(this.email.trim(), this.password).subscribe(ok => {
      if (ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: `Sesión iniciada correctamente`
        });
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
      } else {
        this.loginError = true;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Credenciales inválidas',
          detail: 'El usuario o la contraseña son incorrectos'
        });
      }
    });
  }
}
