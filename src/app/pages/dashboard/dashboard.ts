import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { Sidebar } from '../../components/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { PermissionService } from '../../services/permission.service';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ChartModule,
    ButtonModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    Sidebar,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Stats
  totalTickets = 0;
  pendienteCount = 0;
  enProcesoCount = 0;
  revisionCount = 0;
  finalizadoCount = 0;

  // Grupos del usuario
  groups: GroupData[] = [];
  selectedGroupId: number | null = null;

  // Charts
  statusChartData: any = null;
  priorityChartData: any = null;
  chartOptions: any = null;

  loading = true;
  displayName = '';

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.displayName = user?.displayName ?? 'Usuario';
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // 1. Stats de tickets
      const stats = await this.supabase.getTicketStats();
      this.totalTickets = stats.total;
      this.pendienteCount = stats.byStatus['pendiente'];
      this.enProcesoCount = stats.byStatus['en-proceso'];
      this.revisionCount = stats.byStatus['revision'];
      this.finalizadoCount = stats.byStatus['finalizado'];

      // 2. Grupos del usuario
      const user = this.authService.getCurrentUser();
      if (user?.userId) {
        try {
          this.groups = await this.supabase.getUserGroups(user.userId);
        } catch {
          // Si no hay group_members aún, carga todos los grupos
          this.groups = await this.supabase.getGroups();
        }
      } else {
        this.groups = await this.supabase.getGroups();
      }

      // 3. Construir datos para los gráficos
      this.buildCharts(stats);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    }
    this.loading = false;
  }

  buildCharts(stats: any) {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { family: 'Inter', size: 12 } },
        },
      },
    };

    this.statusChartData = {
      labels: ['Pendiente', 'En Proceso', 'Revisión', 'Finalizado'],
      datasets: [
        {
          data: [
            stats.byStatus['pendiente'],
            stats.byStatus['en-proceso'],
            stats.byStatus['revision'],
            stats.byStatus['finalizado'],
          ],
          backgroundColor: ['#EF4444', '#3B82F6', '#F59E0B', '#10B981'],
          hoverOffset: 8,
        },
      ],
    };

    this.priorityChartData = {
      labels: ['Baja', 'Media', 'Alta', 'Urgente'],
      datasets: [
        {
          label: 'Tickets',
          data: [
            stats.byPriority['baja'],
            stats.byPriority['media'],
            stats.byPriority['alta'],
            stats.byPriority['urgente'],
          ],
          backgroundColor: ['#6EE7B7', '#60A5FA', '#FCD34D', '#F87171'],
          borderRadius: 6,
        },
      ],
    };
  }

  async selectGroup(group: GroupData) {
    this.selectedGroupId = group.id;
    const user = this.authService.getCurrentUser();
    if (user?.userId) {
      try {
        const perms = await this.supabase.getGroupPermissions(user.userId, group.id);
        this.permissionService.setGroupPermissions(String(group.id), perms);
        this.permissionService.refreshPermissionsForGroup(String(group.id));
      } catch (e) {
        console.error('No se pudieron cargar permisos del grupo:', e);
      }
    }
    // Navega a la vista de tickets/Kanban del grupo
    this.router.navigate(['/group'], { queryParams: { groupId: group.id } });
  }

  getStatusProgress(count: number): number {
    return this.totalTickets > 0 ? Math.round((count / this.totalTickets) * 100) : 0;
  }

  can(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
