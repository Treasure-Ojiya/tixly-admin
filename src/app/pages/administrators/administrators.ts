import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminReg } from '../../app-model/model';
import { AuthService } from '../../core/services/auth-service/auth-service';
import { ToastService } from '../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-administrators',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './administrators.html',
  styleUrl: './administrators.css',
})
export class Administrators {
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private toastService = inject(ToastService);

  isRegisterFormSubmitting = false;

  registerForm = this.formBuilder.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private errorText(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d) => `${(d.loc ?? []).slice(1).join('.') || 'field'}: ${d.msg}`)
        .join(' | ');
    }

    return error?.error?.message ?? fallback;
  }

  onCreateAdmin(): void {
    if (this.isRegisterFormSubmitting) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterFormSubmitting = true;

    const value = this.registerForm.getRawValue();

    const adminData: AdminReg = {
      email: value.email!.trim(),
      first_name: value.first_name!.trim(),
      last_name: value.last_name!.trim(),
      phone: value.phone!.trim(),
      password: value.password!,
    };

    this.authService.createAdmin(adminData).subscribe({
      next: () => {
        this.isRegisterFormSubmitting = false;
        this.toastService.show('Admin created successfully', 'success', 6000);
        this.registerForm.reset();
      },
      error: (error) => {
        this.isRegisterFormSubmitting = false;
        this.toastService.show(
          this.errorText(error, 'Error trying to create admin'),
          'error',
          6000,
        );
      },
    });
  }
}
