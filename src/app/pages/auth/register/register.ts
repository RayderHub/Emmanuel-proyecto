import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputMaskModule } from 'primeng/inputmask';

// Validador: al menos 10 caracteres, letras mayúsculas, letras minúsculas, números y al menos un símbolo especial (!@#$%^&*)
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const hasMinLength = value.length >= 10;
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  if (!hasMinLength || !hasSpecialChar) {
    return { passwordStrength: true };
  }
  return null;
}

// Validador: las contraseñas deben coincidir
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

// Validador: solo mayores de edad (>= 18 años)
function adultValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  const birthDate = new Date(control.value);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18 ? null : { notAdult: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterLink,
    ReactiveFormsModule,
    MessageModule,
    ToastModule,
    DatePickerModule,
    CommonModule,
    InputMaskModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  submitted = false;
  maxBirthDate: Date;

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    const today = new Date();
    this.maxBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]],
        fullName: ['', [Validators.required]],
        birthDate: [null, [Validators.required, adultValidator]],
        address: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
      },
      { validators: passwordsMatchValidator }
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor corrige los errores antes de continuar'
      });
      return;
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Registro exitoso',
      detail: `Bienvenido, ${this.registerForm.value.fullName}`
    });
    this.submitted = false;
    this.registerForm.reset();
  }
}
