import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { PermissionDirective } from '../../directives/permission.directive';

interface Student {
  id: number;
  username: string;
  email: string;
  fullName: string;
  birthDate: string;
  address: string;
  phone: string;
}

@Component({
    selector: 'app-group',
    standalone: true,
    imports: [RouterLink, ButtonModule, CardModule, DialogModule, InputTextModule, InputMaskModule, DatePicker, FormsModule, Sidebar, CommonModule, PermissionDirective],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class Group implements OnInit {
  memberCount: number = 3; // Actualizado según la lista inicial
  displayDialog: boolean = false;
  editMode: boolean = false;
  selectedStudent: Student = this.createEmptyStudent();

  constructor(private permissionService: PermissionService) {}

  ngOnInit(): void {
    // Configurar permisos por defecto - puedes cambiar estos según necesites
    this.permissionService.setPermissions([
      'group.create',
      'group.edit', 
      'group.delete'
    ]);
  }

  createEmptyStudent(): Student {
    return {
      id: 0,
      username: '',
      email: '',
      fullName: '',
      birthDate: '',
      address: '',
      phone: ''
    };
  }
  
  students: Student[] = [
    {
      id: 1,
      username: '@emmanuelh',
      email: 'emmanuel.hernandez@email.com',
      fullName: 'Emmanuel Hernandez Rodriguez',
      birthDate: '15/03/1995',
      address: 'Av. Insurgentes Sur 123, Col. Roma Norte, CDMX',
      phone: '5512345678'
    },
    {
      id: 2,
      username: '@juanp',
      email: 'juan.perez@email.com',
      fullName: 'Juan Perez Lopez',
      birthDate: '10/05/1998',
      address: 'Calle Falsa 123, Col. Centro, CDMX',
      phone: '5587654321'
    },
    {
      id: 3,
      username: '@mariag',
      email: 'maria.garcia@email.com',
      fullName: 'Maria Garcia Martinez',
      birthDate: '22/11/2000',
      address: 'Paseo de la Reforma 456, Col. Juarez, CDMX',
      phone: '5544332211'
    }
  ];

  deleteStudent(id: number): void {
    this.students = this.students.filter(s => s.id !== id);
    this.memberCount = this.students.length;
  }

  editStudent(student: Student): void {
    this.selectedStudent = { ...student };
    this.editMode = true;
    this.displayDialog = true;
  }

  addStudent(): void {
    this.selectedStudent = this.createEmptyStudent();
    this.editMode = false;
    this.displayDialog = true;
  }

  saveStudent(): void {
    if (this.editMode) {
      // Actualizar estudiante existente
      const index = this.students.findIndex(s => s.id === this.selectedStudent.id);
      if (index !== -1) {
        this.students[index] = { ...this.selectedStudent };
      }
    } else {
      // Agregar nuevo estudiante
      const newStudent: Student = {
        ...this.selectedStudent,
        id: Date.now(),
        email: this.selectedStudent.username.substring(1) + '@email.com'
      };
      this.students.push(newStudent);
      this.memberCount = this.students.length;
    }
    
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.selectedStudent = this.createEmptyStudent();
  }
}