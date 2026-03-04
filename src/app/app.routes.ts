import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Auth } from './pages/auth/auth';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { User } from './pages/user/user';
import { Group } from './pages/group/group';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'auth',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'user',
    component: User
  },
  {
    path: 'group',
    component: Group
  }
];