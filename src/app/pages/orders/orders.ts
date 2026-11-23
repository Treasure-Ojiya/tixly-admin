import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { AdminFetchOrders, AdminFetchOrderStats, AdminFetchOrderId } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

type SortKey = 'date_desc' | 'date_asc' | 'total_desc';

interface Option {
  id: string;
  label: string;
  count: number;
}

const PAGE_SIZE = 10;

const REFUNDABLE = ['completed', 'paid'];

@Component({
  selector: 'app-orders',
  imports: [DatePipe, DecimalPipe, CurrencyPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly appService = inject(AppService);

  readonly stats = signal<AdminFetchOrderStats | null>(null);
  readonly statsLoading = signal(true);

  readonly orders = signal<AdminFetchOrders[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly typeFilter = signal('all');
  readonly sortBy = signal<SortKey>('date_desc');
  readonly page = signal(0);

  readonly selected = signal<AdminFetchOrderId | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly confirmingRefund = signal(false);
  readonly isRefunding = signal(false);
  readonly refundError = signal('');

  readonly statusOptions = computed(() => this.buildOptions((options) => options.status));
  readonly typeOptions = computed(() => this.buildOptions((options) => options.type.slice(1)));

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();

    const rows = this.orders().filter(
      (options) =>
        (status === 'all' || options.status.toLowerCase() === type) &&
        (!q ||
          options.order_id.toLowerCase().includes(q) ||
          options.buyer.toLowerCase().includes(q) ||
          options.event.toLowerCase().includes(q)),
    );

    const time = (options: AdminFetchOrders) => new Date(options.date).getTime() || 0;
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
  readonly rangeStart = computed(() =>
    this.filtered().length === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.filtered().length),
  );
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
      next: (stat) => {
        this.stats.set(stat);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false),
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
        this.loadError.set('Could not load orders.');
        this.isLoading.set(false);
      },
    });
  }

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

  openOrder(row: AdminFetchOrders): void {
    this.selected.set(row); // same shape: show the row instantly, then refresh from the API
    this.detailError.set('');
    this.refundError.set('');
    this.confirmingRefund.set(false);
    this.detailLoading.set(true);

    this.appService.getOrders(row.order_id).subscribe({
      next: (full) => {
        const order = full[0];
        if (order && this.selected()?.order_id === order.order_id) {
          this.selected.set(order);
        }
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
    this.confirmingRefund.set(false);
  }

  // canRefund(order: { status: string; total: number }): boolean {
  //   return REFUNDABLE.includes(order.status.toLowerCase()) && order.total > 0;
  // }

  // startRefund(): void {
  //   this.refundError.set('');
  //   this.confirmingRefund.set(true);
  // }

  // cancelRefund(): void {
  //   this.confirmingRefund.set(false);
  // }

  // confirmRefund(): void {
  //   const order = this.selected();
  //   if (!order || this.isRefunding()) return;

  //   this.isRefunding.set(true);
  //   this.refundError.set('');

  //   this.appService.refundOrder(order.order_id).subscribe({
  //     next: (updated) => {
  //       // Reflect the refund in the drawer and in the list
  //       this.selected.set(updated);
  //       this.orders.update((list) =>
  //         list.map((o) => (o.order_id === updated.order_id ? { ...o, ...updated } : o)),
  //       );
  //       this.isRefunding.set(false);
  //       this.confirmingRefund.set(false);
  //       this.loadStats(); // counts changed
  //       // this.toast.success('Order refunded');
  //     },
  //     error: () => {
  //       this.refundError.set('The refund could not be completed. Nothing was changed.');
  //       this.isRefunding.set(false);
  //       // this.toast.error(...)
  //     },
  //   });
  // }

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
    if (['refunded', 'failed', 'cancelled', 'canceled'].includes(s))
      return 'bg-danger/10 text-danger-dark';
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
