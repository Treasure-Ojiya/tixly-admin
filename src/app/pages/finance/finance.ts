import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminFetchFinance, AdminFetchFinancePayouts } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

const PAGE_STEP = 10;

interface StatusOption {
  id: string; // 'all' or a lowercase status
  label: string;
  count: number;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './finance.html',
})
export class Finance implements OnInit {
  private readonly appService = inject(AppService);
  // private readonly toast = inject(ToastService);  // wire your toast here

  // ─── Summary ───
  readonly finance = signal<AdminFetchFinance | null>(null);
  readonly financeLoading = signal(true);
  readonly financeError = signal('');

  // ─── History ───
  readonly payouts = signal<AdminFetchFinancePayouts[]>([]);
  readonly payoutsLoading = signal(true);
  readonly payoutsError = signal('');

  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly visibleCount = signal(PAGE_STEP);

  readonly statusOptions = computed<StatusOption[]>(() => {
    const list = this.payouts();
    const counts = new Map<string, number>();
    for (const p of list) {
      const key = p.status.toLowerCase();
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
    const status = this.statusFilter();

    return this.payouts()
      .filter(
        (p) =>
          (status === 'all' || p.status.toLowerCase() === status) &&
          (!q || p.event.toLowerCase().includes(q)),
      )
      .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  });

  readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.filtered().length > this.visibleCount());
  readonly hasActiveFilters = computed(
    () => !!this.query().trim() || this.statusFilter() !== 'all',
  );

  ngOnInit(): void {
    this.loadFinance();
    this.loadPayouts();
  }

  loadFinance(): void {
    this.financeLoading.set(true);
    this.financeError.set('');

    this.appService.getFinance().subscribe({
      next: (f) => {
        this.finance.set(f);
        this.financeLoading.set(false);
      },
      error: () => {
        this.financeError.set('The finance summary could not be loaded.');
        this.financeLoading.set(false);
        // this.toast.error(...)
      },
    });
  }

  loadPayouts(): void {
    this.payoutsLoading.set(true);
    this.payoutsError.set('');

    this.appService.getFinancePayout().subscribe({
      next: (payout: AdminFetchFinancePayouts) => {
        this.payouts.set([payout]);
        this.payoutsLoading.set(false);
      },
      error: () => {
        this.payoutsError.set('The payout history could not be loaded.');
        this.payoutsLoading.set(false);
        // this.toast.error(...)
      },
    });
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.visibleCount.set(PAGE_STEP);
  }

  setStatus(id: string): void {
    this.statusFilter.set(id);
    this.visibleCount.set(PAGE_STEP);
  }

  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
    this.visibleCount.set(PAGE_STEP);
  }

  showMore(): void {
    this.visibleCount.update((n) => n + PAGE_STEP);
  }

  // ─── Display helpers ───
  label(value: string): string {
    const s = value.replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusClasses(status: string): string {
    const s = status.toLowerCase();
    if (['completed', 'paid', 'success', 'successful', 'settled'].includes(s))
      return 'bg-success/10 text-success-dark';
    if (['pending', 'processing'].includes(s)) return 'bg-accent/30 text-accent-dark';
    if (['failed', 'rejected', 'cancelled', 'canceled', 'reversed'].includes(s))
      return 'bg-danger/10 text-danger-dark';
    return 'bg-ink/10 text-ink/70';
  }
}
