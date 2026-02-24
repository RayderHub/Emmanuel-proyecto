import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Credenciales hardcodeadas
const VALID_CREDENTIALS = {
  email: 'admin@correo.com',
  password: 'Admin@12345'
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterLink,
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

  constructor(private router: Router, private messageService: MessageService) { }

  onLogin(): void {
    if (
      this.email === VALID_CREDENTIALS.email &&
      this.password === VALID_CREDENTIALS.password
    ) {
      this.loginError = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Bienvenido',
        detail: 'Inicio de sesión exitoso'
      });
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    } else {
      this.loginError = true;
      this.messageService.add({
        severity: 'error',
        summary: 'Credenciales inválidas',
        detail: 'El correo o la contraseña son incorrectos'
      });
    }
  }
}
