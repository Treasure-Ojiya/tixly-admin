import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// TODO: adjust these two import paths to your project
import { AdminLoginRequest } from '../../../app-model/model';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly isSubmitting = signal(false);
  readonly loginError = signal('');

  isInvalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  onLogin(): void {
    if (this.isSubmitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials: AdminLoginRequest = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.loginError.set('');

    this.authService.loginAdmin(credentials).subscribe({
      next: (res) => {
        this.authService.saveSession(res, credentials.email);
        this.toastService.show('Login successful', 'success', 6000);

        this.isSubmitting.set(false);

        // Go back to where the admin was heading, but only inside the admin area.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(
          returnUrl && returnUrl.startsWith('/admin') ? returnUrl : '/admin/overview',
        );
      },
      error: (err: unknown) => {
        this.loginError.set(this.messageFor(err));
        this.isSubmitting.set(false);
      },
    });
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)
        return 'Could not reach the server. Check your connection and try again.';
      if ([400, 401, 403, 422].includes(err.status)) return 'Incorrect email or password.';

      const detail = (err.error as { detail?: unknown } | null)?.detail;
      if (typeof detail === 'string') return detail;
    }
    return 'Something went wrong while signing in. Please try again.';
  }
}
