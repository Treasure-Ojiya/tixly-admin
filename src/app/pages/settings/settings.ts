import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

// TODO: adjust these paths. EventCategories comes from your main app's model;
// copy it into your admin models file if it isn't there yet.
import { EventCategories } from '../../app-model/model';
import { AuthService } from '../../../app/core/services/auth-service/auth-service';

const USER_KEY = 'admin_user'; // what the layout's name box reads

interface Notice {
  type: 'success' | 'error';
  text: string;
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('new_password')?.value;
  const confirm = group.get('confirm_password')?.value;
  return next && confirm && next !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  // private readonly toast = inject(ToastService);  // wire your toast here

  // ─── Account ───
  readonly accountForm = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  readonly isSavingAccount = signal(false);
  readonly accountNotice = signal<Notice | null>(null);

  // ─── Password ───
  readonly passwordForm = this.fb.nonNullable.group(
    {
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly isSavingPassword = signal(false);
  readonly passwordNotice = signal<Notice | null>(null);

  // ─── Categories ───
  readonly categories = signal<EventCategories[]>([]);
  readonly categoriesLoading = signal(true);
  readonly categoriesError = signal('');

  readonly newCategory = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(60),
  ]);
  readonly isAddingCategory = signal(false);
  readonly categoryNotice = signal<Notice | null>(null);

  ngOnInit(): void {
    this.fillAccountFromSession();
    this.loadCategories();
  }

  // ─────────────── Account ───────────────

  get displayName(): string {
    const { first_name, last_name } = this.accountForm.getRawValue();
    return `${first_name} ${last_name}`.trim() || 'Administrator';
  }

  get initials(): string {
    const { first_name, last_name } = this.accountForm.getRawValue();
    return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase() || 'A';
  }

  /** The login response has no name, so start from whatever was saved at sign-in. */
  private fillAccountFromSession(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}') as {
        first_name?: string;
        last_name?: string;
        email?: string;
      };
      this.accountForm.patchValue({
        first_name: saved.first_name ?? '',
        last_name: saved.last_name ?? '',
        email: saved.email ?? '',
      });
      this.accountForm.markAsPristine();
    } catch {
      /* nothing saved: start empty */
    }
  }

  saveAccount(): void {
    if (this.isSavingAccount()) return;

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const v = this.accountForm.getRawValue();
    const body = {
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      email: v.email.trim(),
    };

    this.isSavingAccount.set(true);
    this.accountNotice.set(null);

    // this.authService.updateAdminProfile(body).subscribe({
    //   next: () => {
    //     // Keep the sidebar in step (it reads this on the next page load)
    //     try {
    //       localStorage.setItem(USER_KEY, JSON.stringify(body));
    //     } catch {
    //       /* ignore */
    //     }
    //     this.accountForm.markAsPristine();
    //     this.isSavingAccount.set(false);
    //     this.accountNotice.set({ type: 'success', text: 'Your account details were saved.' });
    //     // this.toast.success('Account updated');
    //   },
    //   error: (err: unknown) => {
    //     this.isSavingAccount.set(false);
    //     this.accountNotice.set({
    //       type: 'error',
    //       text: this.errorText(err, 'Your changes could not be saved.'),
    //     });
    //   },
    // });
  }

  // ─────────────── Password ───────────────

  changePassword(): void {
    if (this.isSavingPassword()) return;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const v = this.passwordForm.getRawValue();

    this.isSavingPassword.set(true);
    this.passwordNotice.set(null);

    // this.authService
    //   .changeAdminPassword({
    //     current_password: v.current_password,
    //     new_password: v.new_password,
    //   })
    //   .subscribe({
    //     next: () => {
    //       this.passwordForm.reset();
    //       this.isSavingPassword.set(false);
    //       this.passwordNotice.set({ type: 'success', text: 'Your password was updated.' });
    //       // this.toast.success('Password updated');
    //     },
    //     error: (err: unknown) => {
    //       this.isSavingPassword.set(false);
    //       this.passwordNotice.set({
    //         type: 'error',
    //         text: this.errorText(err, 'Your password could not be updated.'),
    //       });
    //     },
    //   });
  }

  // ─────────────── Categories ───────────────

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesError.set('');

    this.authService.getCategories().subscribe({
      next: (list) => {
        this.categories.set(this.sorted(list));
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categoriesError.set('The categories could not be loaded.');
        this.categoriesLoading.set(false);
        // this.toast.error(...)
      },
    });
  }

  addCategory(): void {
    if (this.isAddingCategory()) return;

    const name = this.newCategory.value.trim();

    if (this.newCategory.invalid || !name) {
      this.newCategory.markAsTouched();
      return;
    }

    // Skip duplicates before bothering the server
    if (this.categories().some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
      this.categoryNotice.set({ type: 'error', text: `"${name}" already exists.` });
      return;
    }

    this.isAddingCategory.set(true);
    this.categoryNotice.set(null);

    this.authService.createCategory({ name }).subscribe({
      next: (created) => {
        this.categories.update((list) => this.sorted([...list, created]));
        this.newCategory.reset('');
        this.isAddingCategory.set(false);
        this.categoryNotice.set({ type: 'success', text: `"${created.name}" was added.` });
        // this.toast.success('Category added');
      },
      error: (err: unknown) => {
        this.isAddingCategory.set(false);
        this.categoryNotice.set({
          type: 'error',
          text: this.errorText(err, 'The category could not be added.'),
        });
      },
    });
  }

  // ─────────────── Helpers ───────────────

  isInvalid(form: 'account' | 'password', name: string): boolean {
    const c: AbstractControl | null =
      form === 'account'
        ? this.accountForm.get(name)
        : this.passwordForm.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  private sorted(list: EventCategories[]): EventCategories[] {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  private errorText(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Could not reach the server. Check your connection.';

      const detail = (err.error as { detail?: unknown } | null)?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return detail
          .map(
            (d: { loc?: string[]; msg?: string }) =>
              `${(d.loc ?? []).slice(1).join('.') || 'field'}: ${d.msg}`,
          )
          .join(' | ');
      }
    }
    return fallback;
  }
}
