import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [RouterLink, ButtonModule, CardModule, Sidebar],
    templateUrl: './user.html',
    styleUrl: './user.css'
})
export class User { 
  isDeleted: boolean = false;
  
  profile = {
    username: '@usuario',
    email: 'usuario@email.com',
    fullName: 'Nombre Completo',
    role: 'Usuario',
    birthDate: '01/01/1990',
    age: 34,
    address: 'Dirección de ejemplo',
    phone: '(555) 123-4567',
    memberSince: '2024',
    projects: 5,
    followers: 120,
    following: 85
  };

  editProfile(): void {
    // Lógica para editar perfil
    console.log('Editando perfil...');
  }

  deleteProfile(): void {
    this.isDeleted = true;
    console.log('Perfil eliminado (visualmente)');
  }

  restoreProfile(): void {
    this.isDeleted = false;
    console.log('Perfil restaurado');
  }
}