import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  displayName: string = '';

  constructor(
    public authService: AuthService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.displayName = user?.displayName ?? 'Invitado';
  }

  can(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  logout(): void {
    this.authService.logout();
  }
}