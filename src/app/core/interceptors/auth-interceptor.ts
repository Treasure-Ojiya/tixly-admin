import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment'; // adjust the depth to where this file lives

const TOKEN_KEY = 'access_token'; // same key your login service reads
const USER_KEY = 'admin_user'; // the admin's name and email, used by the layout

const PUBLIC_PATHS = ['/auth/admin/login', '/auth/admin/bootstrap'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.BASE_URL) || req.url.startsWith('/');
  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));

  let outgoing = req;
  if (isApiCall && !isPublic) {
    const token = readToken();
    if (token) {
      outgoing = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiCall && !isPublic) {
        clearSession();
        router.navigate(['/admin/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      // A 403 means "signed in but not allowed", so the session is kept.
      // Show your toast for other errors here if you want one place for it.

      return throwError(() => error);
    }),
  );
};

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}
