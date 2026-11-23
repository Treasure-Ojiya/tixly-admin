import { DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminFetchUsers, AdminFetchUsersId } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

type SortKey = 'joined_desc' | 'joined_asc' | 'name_asc';

interface TypeOption {
  id: string; // 'all' or a lowercase account type
  label: string;
  count: number;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly appService = inject(AppService);
  private readonly fb = inject(FormBuilder);
  // private readonly toast = inject(ToastService);  // wire your toast here

  // ─── List ───
  readonly users = signal<AdminFetchUsers[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  // ─── Controls ───
  readonly query = signal('');
  readonly typeFilter = signal('all');
  readonly sortBy = signal<SortKey>('joined_desc');
  readonly page = signal(0);

  // ─── Detail drawer ───
  readonly selected = signal<AdminFetchUsersId | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');

  // ─── Edit ───
  readonly editing = signal(false);
  readonly isSaving = signal(false);
  readonly saveError = signal('');
  readonly confirmingEmail = signal(false);

  readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    organization: [''],
  });

  // ─── Derived ───
  readonly typeOptions = computed<TypeOption[]>(() => {
    const list = this.users();
    const counts = new Map<string, number>();
    for (const u of list) {
      const key = u.account_type.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'All', count: list.length },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: this.label(id), count })),
    ];
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const type = this.typeFilter();

    const rows = this.users().filter(
      (u) =>
        (type === 'all' || u.account_type.toLowerCase() === type) &&
        (!q ||
          this.fullName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q) ||
          (u.organization ?? '').toLowerCase().includes(q)),
    );

    const time = (u: AdminFetchUsers) => new Date(u.created_at).getTime() || 0;
    switch (this.sortBy()) {
      case 'joined_asc':
        return rows.sort((a, b) => time(a) - time(b));
      case 'name_asc':
        return rows.sort((a, b) => this.fullName(a).localeCompare(this.fullName(b)));
      default:
        return rows.sort((a, b) => time(b) - time(a));
    }
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly paged = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  readonly rangeStart = computed(() =>
    this.filtered().length === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.filtered().length),
  );
  readonly hasActiveFilters = computed(() => !!this.query().trim() || this.typeFilter() !== 'all');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.appService.getUsers({} as AdminFetchUsersId).subscribe({
      next: (list) => {
        this.users.set(Array.isArray(list) ? list : [list]);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('The users could not be loaded.');
        this.isLoading.set(false);
        // this.toast.error(...)
      },
    });
  }

  // ─── Control handlers (each returns to page 1) ───
  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(0);
  }
  setType(id: string): void {
    this.typeFilter.set(id);
    this.page.set(0);
  }
  onSort(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortKey);
    this.page.set(0);
  }
  clearFilters(): void {
    this.query.set('');
    this.typeFilter.set('all');
    this.page.set(0);
  }
  prevPage(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }
  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  // ─── Detail drawer ───
  openUser(row: AdminFetchUsers): void {
    this.selected.set(row); // same shape: show the row instantly, then refresh from the API
    this.detailError.set('');
    this.resetEdit();
    this.detailLoading.set(true);

    this.appService.getUsers(row).subscribe({
      next: (full) => {
        if (this.selected()?.uuid === full.uuid) this.selected.set(full);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailError.set(
          'Showing the details from the list. Latest details could not be loaded.',
        );
        this.detailLoading.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  closeDetail(): void {
    this.selected.set(null);
    this.resetEdit();
  }

  // ─── Edit ───
  isOrganization(u: { account_type: string }): boolean {
    return u.account_type.toLowerCase() === 'organization';
  }

  startEdit(): void {
    const u = this.selected();
    if (!u) return;

    this.form.reset({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone ?? '',
      organization: u.organization ?? '',
    });
    // Organization accounts must keep an organization name
    this.form.controls.organization.setValidators(
      this.isOrganization(u) ? Validators.required : null,
    );
    this.form.controls.organization.updateValueAndValidity();

    this.saveError.set('');
    this.confirmingEmail.set(false);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.resetEdit();
  }

  /** True when the email was changed from what is saved. */
  emailChanged(): boolean {
    const u = this.selected();
    if (!u) return false;
    return this.form.controls.email.value.trim().toLowerCase() !== u.email.toLowerCase();
  }

  isInvalid(name: 'first_name' | 'last_name' | 'email' | 'organization'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  save(): void {
    if (this.isSaving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Changing an email changes how the person signs in: ask once more
    if (this.emailChanged() && !this.confirmingEmail()) {
      this.confirmingEmail.set(true);
      return;
    }

    const u = this.selected();
    if (!u) return;

    const v = this.form.getRawValue();
    this.isSaving.set(true);
    this.saveError.set('');

    this.appService
      .updateUser(u.uuid, {
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        organization: v.organization.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.selected.set(updated);
          this.users.update((list) =>
            list.map((x) => (x.uuid === updated.uuid ? { ...x, ...updated } : x)),
          );
          this.isSaving.set(false);
          this.resetEdit();
          // this.toast.success('User updated');
        },
        error: () => {
          this.saveError.set('The changes could not be saved. Nothing was changed.');
          this.isSaving.set(false);
          this.confirmingEmail.set(false);
          // this.toast.error(...)
        },
      });
  }

  private resetEdit(): void {
    this.editing.set(false);
    this.confirmingEmail.set(false);
    this.saveError.set('');
  }

  // ─── Display helpers ───
  fullName(u: { first_name: string; last_name: string }): string {
    return `${u.first_name} ${u.last_name}`.trim();
  }

  initials(u: { first_name: string; last_name: string }): string {
    return `${u.first_name.charAt(0)}${u.last_name.charAt(0)}`.toUpperCase() || '?';
  }

  label(value: string): string {
    const s = value.replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  typeClasses(type: string): string {
    return type.toLowerCase() === 'organization'
      ? 'bg-brand-soft text-brand-dark'
      : 'bg-ink/10 text-ink/70';
  }
}
