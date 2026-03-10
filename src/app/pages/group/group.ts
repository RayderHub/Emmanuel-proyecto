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

interface GroupData {
  id: number;
  name: string;
  description: string;
  course: string;
  semester: string;
  createdAt: string;
  studentCount: number;
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
  
  // Properties for groups CRUD
  displayGroupDialog: boolean = false;
  groupEditMode: boolean = false;
  selectedGroup: GroupData = this.createEmptyGroup();

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

  createEmptyGroup(): GroupData {
    return {
      id: 0,
      name: '',
      description: '',
      course: '',
      semester: '',
      createdAt: new Date().toLocaleDateString(),
      studentCount: 0
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

  groups: GroupData[] = [
    {
      id: 1,
      name: 'Grupo A',
      description: 'Grupo de programación avanzada',
      course: 'Programación',
      semester: '2024-1',
      createdAt: '15/01/2024',
      studentCount: 25
    },
    {
      id: 2,
      name: 'Grupo B', 
      description: 'Grupo de bases de datos',
      course: 'Bases de Datos',
      semester: '2024-1',
      createdAt: '20/01/2024',
      studentCount: 18
    },
    {
      id: 3,
      name: 'Grupo C',
      description: 'Grupo de desarrollo web',
      course: 'Desarrollo Web',
      semester: '2024-2',
      createdAt: '05/02/2024',
      studentCount: 22
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

  // Group CRUD methods
  addGroup(): void {
    this.selectedGroup = this.createEmptyGroup();
    this.groupEditMode = false;
    this.displayGroupDialog = true;
  }

  editGroup(group: GroupData): void {
    this.selectedGroup = { ...group };
    this.groupEditMode = true;
    this.displayGroupDialog = true;
  }

  deleteGroup(id: number): void {
    this.groups = this.groups.filter(g => g.id !== id);
  }

  saveGroup(): void {
    if (this.groupEditMode) {
      // Actualizar grupo existente
      const index = this.groups.findIndex(g => g.id === this.selectedGroup.id);
      if (index !== -1) {
        this.groups[index] = { ...this.selectedGroup };
      }
    } else {
      // Agregar nuevo grupo
      const newGroup: GroupData = {
        ...this.selectedGroup,
        id: Date.now()
      };
      this.groups.push(newGroup);
    }
    
    this.displayGroupDialog = false;
    this.selectedGroup = this.createEmptyGroup();
  }

  hideGroupDialog(): void {
    this.displayGroupDialog = false;
    this.selectedGroup = this.createEmptyGroup();
  }
}