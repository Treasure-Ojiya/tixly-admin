import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth-service/auth-service';

/** Protects the admin layout and everything inside it. Signed-out visitors go to login. */
export const authGuard: CanActivateFn & CanActivateChildFn = (_route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/admin/login'], {
        // lets the login page send the admin back to where they were going
        queryParams: { returnUrl: state.url },
      });
};

/** For login and setup: signed-in admins go straight to the dashboard. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated() ? router.createUrlTree(['/admin/overview']) : true;
};
