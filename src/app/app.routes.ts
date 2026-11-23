import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth-guard';

/*
 * Assumed file layout (adjust the import paths / class names if yours differ):
 *   src/app/pages/auth/login/login.component.ts          -> LoginComponent
 *   src/app/pages/auth/register/register.component.ts   -> RegisterComponent  (first-admin setup)
 *   src/app/layout/admin-layout/admin-layout.component.ts -> AdminLayoutComponent
 *   src/app/pages/overview/overview.component.ts         -> OverviewComponent
 *   src/app/pages/administrators/administrators.component.ts -> AdministratorsComponent
 */
export const routes: Routes = [
  // ─── Public: auth pages (no layout). Signed-in admins get bounced to the dashboard ───
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    title: 'Sign in · Tixly Admin',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    // The first-admin (bootstrap) page. Don't link to it from the UI.
    path: 'admin/setup',
    canActivate: [guestGuard],
    title: 'Set up · Tixly Admin',
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },

  // ─── Protected: everything inside the admin layout ───
  {
    path: 'admin',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Overview · Tixly Admin',
        loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview),
      },
      {
        path: 'admins',
        title: 'Administrators · Tixly Admin',
        loadComponent: () =>
          import('./pages/administrators/administrators').then((m) => m.Administrators),
      },

      // Add these as you build them (the sidebar already links to them):
      {
        path: 'events',
        title: 'Events · Tixly Events',
        loadComponent: () => import('./pages/events/events').then((m) => m.Events),
      },
      {
        path: 'users',
        title: 'Users · Tixly Users',
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
      },
      {
        path: 'orders',
        title: 'Orders · Tixly Orders',
        loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'finance',
        title: 'Payouts ·Tixly Finance',
        loadComponent: () => import('./pages/finance/finance').then((m) => m.Finance),
      },
      {
        path: 'settings',
        title: 'Settings · Settings',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
      },
    ],
  },

  // ─── Fallbacks ───
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  { path: '**', redirectTo: 'admin' },
];
