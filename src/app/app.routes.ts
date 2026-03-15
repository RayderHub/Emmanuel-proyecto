import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Auth } from './pages/auth/auth';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { User } from './pages/user/user';
import { Group } from './pages/group/group';
import { Tickets } from './pages/tickets/tickets';
import { authGuard, permissionGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas (auth)
  {
    path: 'auth',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Rutas protegidas - accesibles para todos los usuarios logueados
  {
    path: '',
    component: Home
  },
  {
    path: 'user',
    component: User,
    canActivate: [authGuard]
  },

  // Rutas protegidas - solo superusuario (permiso nav.groups / nav.tickets)
  {
    path: 'group',
    component: Group,
    canActivate: [permissionGuard('nav.groups')]
  },
  {
    path: 'tickets',
    component: Tickets,
    canActivate: [permissionGuard('nav.tickets')]
  }
];