import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { AdminFetchOrderId, AdminFetchOrderStats, AdminFetchOrders } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

type SortKey = 'date_desc' | 'date_asc' | 'total_desc';

interface Option {
  id: string; // 'all' or a lowercase value
  label: string;
  count: number;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly appService = inject(AppService);
  // private readonly toast = inject(ToastService);  // wire your toast here

  // ─── Stats ───
  readonly stats = signal<AdminFetchOrderStats | null>(null);
  readonly statsLoading = signal(true);

  // ─── List ───
  readonly orders = signal<AdminFetchOrders[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  // ─── Controls ───
  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly typeFilter = signal('all');
  readonly sortBy = signal<SortKey>('date_desc');
  readonly page = signal(0);

  // ─── Detail drawer (read-only) ───
  readonly selected = signal<AdminFetchOrderId | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');

  // ─── Derived ───
  readonly statusOptions = computed(() => this.buildOptions((o) => o.status));
  readonly typeOptions = computed(() => this.buildOptions((o) => o.type).slice(1)); // no "All" pill

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();

    const rows = this.orders().filter(
      (o) =>
        (status === 'all' || o.status.toLowerCase() === status) &&
        (type === 'all' || o.type.toLowerCase() === type) &&
        (!q ||
          o.order_id.toLowerCase().includes(q) ||
          o.buyer.toLowerCase().includes(q) ||
          o.event.toLowerCase().includes(q)),
    );

    const time = (o: AdminFetchOrders) => new Date(o.date).getTime() || 0;
    switch (this.sortBy()) {
      case 'date_asc':
        return rows.sort((a, b) => time(a) - time(b));
      case 'total_desc':
        return rows.sort((a, b) => b.total - a.total);
      default:
        return rows.sort((a, b) => time(b) - time(a));
    }
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly paged = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  readonly rangeStart = computed(() => (this.filtered().length === 0 ? 0 : this.page() * PAGE_SIZE + 1));
  readonly rangeEnd = computed(() => Math.min((this.page() + 1) * PAGE_SIZE, this.filtered().length));
  readonly hasActiveFilters = computed(
    () => !!this.query().trim() || this.statusFilter() !== 'all' || this.typeFilter() !== 'all',
  );

  ngOnInit(): void {
    this.loadStats();
    this.loadOrders();
  }

  loadStats(): void {
    this.statsLoading.set(true);

    this.appService.getOrderStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false), // cards show a dash; the table still works
    });
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.appService.getOrders().subscribe({
      next: (list) => {
        this.orders.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('The orders could not be loaded.');
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
  setStatus(id: string): void {
    this.statusFilter.set(id);
    this.page.set(0);
  }
  onType(event: Event): void {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(0);
  }
  onSort(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortKey);
    this.page.set(0);
  }
  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
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
  openOrder(row: AdminFetchOrders): void {
    this.selected.set(row); // same shape: show the row instantly, then refresh from the API
    this.detailError.set('');
    this.detailLoading.set(true);

    this.appService.getOrderById(row.order_id).subscribe({
      next: (full) => {
        if (this.selected()?.order_id === full.order_id) this.selected.set(full);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailError.set('Showing the details from the list. Latest details could not be loaded.');
        this.detailLoading.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  closeDetail(): void {
    this.selected.set(null);
  }

  // ─── Display helpers ───
  shortId(id: string): string {
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  }

  label(value: string): string {
    const s = value.replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusClasses(status: string): string {
    const s = status.toLowerCase();
    if (['completed', 'paid', 'success'].includes(s)) return 'bg-success/10 text-success-dark';
    if (['pending', 'processing'].includes(s)) return 'bg-accent/30 text-accent-dark';
    if (['refunded', 'failed', 'cancelled', 'canceled'].includes(s)) return 'bg-danger/10 text-danger-dark';
    return 'bg-ink/10 text-ink/70';
  }

  private buildOptions(pick: (o: AdminFetchOrders) => string): Option[] {
    const list = this.orders();
    const counts = new Map<string, number>();
    for (const o of list) {
      const key = pick(o).toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'All', count: list.length },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: this.label(id), count })),
    ];
  }
}