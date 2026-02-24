import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CardModule, InputTextModule, PasswordModule, ButtonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {}
