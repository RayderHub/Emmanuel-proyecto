import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Auth } from './pages/auth/auth';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { User } from './pages/user/user';
import { Group } from './pages/group/group';
import { Tickets } from './pages/tickets/tickets';
import { UserManagement } from './pages/user-management/user-management';
import { Dashboard } from './pages/dashboard/dashboard';
import { AdminGroup } from './pages/admin-group/admin-group';
import { authGuard, permissionGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas (auth)
  {
    path: 'auth',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Landing page pública
  { path: '', component: Home },

  // ── Rutas protegidas (requieren estar autenticado) ──

  // Dashboard principal (post-login)
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },

  // Perfil del usuario
  {
    path: 'user',
    component: User,
    canActivate: [authGuard],
  },

  // Grupos / WorkSpaces → Kanban+Lista de tickets
  {
    path: 'group',
    component: Group,
    canActivate: [permissionGuard('group:view')],
  },

  // Vista de tickets standalone
  {
    path: 'tickets',
    component: Tickets,
    canActivate: [permissionGuard('ticket:view')],
  },

  // Admin: gestión de grupos y permisos por grupo
  {
    path: 'admin/groups',
    component: AdminGroup,
    canActivate: [permissionGuard('group:manage')],
  },

  // Admin: gestión de usuarios
  {
    path: 'admin/users',
    component: UserManagement,
    canActivate: [permissionGuard('user:manage')],
  },
];