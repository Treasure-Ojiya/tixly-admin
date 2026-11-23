import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminRegBootstrap, AdminReg } from '../../../app-model/model';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

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

  /** True when a control is invalid AND has been touched/dirtied. */
  isInvalid(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onRegisterBootstrap(): void {
    if (this.isRegisterFormSubmitting) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterFormSubmitting = true;

    const value = this.registerForm.getRawValue();

    const regData: AdminRegBootstrap = {
      email: value.email!.trim(),
      first_name: value.first_name!.trim(),
      last_name: value.last_name!.trim(),
      phone: value.phone!.trim(),
      password: value.password!,
    };

    this.authService.registerAdmin(regData).subscribe({
      next: () => {
        this.isRegisterFormSubmitting = false;
        this.toastService.show('Account created. Please sign in.', 'success', 6000);
        this.router.navigate(['/admin/login']);
      },
      error: (error) => {
        this.isRegisterFormSubmitting = false;
        this.toastService.show(this.errorText(error, 'Account creation failed'), 'error', 6000);
      },
    });
  }

  // onCreateAdmin(): void {
  //   if (this.isRegisterFormSubmitting) {
  //     return;
  //   }

  //   if (this.registerForm.invalid) {
  //     this.registerForm.markAllAsTouched();
  //     return;
  //   }

  //   this.isRegisterFormSubmitting = true;

  //   const value = this.registerForm.getRawValue();

  //   const adminData: AdminReg = {
  //     email: value.email!.trim(),
  //     first_name: value.first_name!.trim(),
  //     last_name: value.last_name!.trim(),
  //     phone: value.phone!.trim(),
  //     password: value.password!,
  //   };

  //   this.authService.createAdmin(adminData).subscribe({
  //     next: () => {
  //       this.isRegisterFormSubmitting = false;
  //       this.toastService.show('Admin created successfully', 'success', 6000);
  //     },
  //     error: (error) => {
  //       this.isRegisterFormSubmitting = false;
  //       this.toastService.show(
  //         this.errorText(error, 'Error trying to create admin'),
  //         'error',
  //         6000,
  //       );
  //     },
  //   });
  // }
}
