import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminFetchEvents } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

type SortKey = 'date_desc' | 'date_asc' | 'sold_desc';

interface StatusOption {
  id: string;
  label: string;
  count: number;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-events',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events implements OnInit {
  private readonly appService = inject(AppService);

  readonly pageSize = PAGE_SIZE;

  readonly events = signal<AdminFetchEvents[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly featuredOnly = signal(false);
  readonly sortBy = signal<SortKey>('date_desc');
  readonly page = signal(0);

  readonly statusOptions = computed<StatusOption[]>(() => {
    const list = this.events();
    const counts = new Map<string, number>();
    for (const e of list) {
      const key = e.status.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'All', count: list.length },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: this.statusLabel(id), count })),
    ];
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const featured = this.featuredOnly();

    const rows = this.events().filter(
      (e) =>
        (status === 'all' || e.status.toLowerCase() === status) &&
        (!featured || e.featured) &&
        (!q || e.title.toLowerCase().includes(q)),
    );

    const time = (e: AdminFetchEvents) => new Date(e.date).getTime() || 0;
    switch (this.sortBy()) {
      case 'date_asc':
        return rows.sort((a, b) => time(a) - time(b));
      case 'sold_desc':
        return rows.sort((a, b) => b.tickets_sold - a.tickets_sold);
      default:
        return rows.sort((a, b) => time(b) - time(a));
    }
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  readonly paged = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  readonly rangeStart = computed(() => {
    this.filtered().length === 0 ? 0 : this.page() * PAGE_SIZE;
  });
  readonly rangeEnd = computed(() => {
    Math.min((this.page() + 1) * PAGE_SIZE, this.filtered().length);
  });

  readonly hasActiveFilters = computed(
    () => !!this.query().trim() || this.statusFilter() !== 'all' || this.featuredOnly(),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.appService.getEvents().subscribe({
      next: (list) => {
        this.events.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Fail to fetch');
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

  toggleFeatured(): void {
    this.featuredOnly.update((f) => !f);
  }

  onSort(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortKey);
    this.page.set(0);
  }

  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
    this.featuredOnly.set(false);
    this.page.set(0);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  statusLabel(status: string): string {
    const s = status.replace(/_/g, '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusClasses(status: string): string {
    const s = status.toLowerCase();
    if (['published', 'active', 'live'].includes(s)) return 'bg-success/10 text-success-dark';
    if (['pending', 'upcoming'].includes(s)) return 'bg-accent/30 text-accent-dark';
    if (['cancelled', 'cancel', 'rejected', 'suspended', 'unpublished'].includes(s))
      return 'bg-danger/10 text-danger-dark';
    return 'bgink/10 text-ink/70';
  }
}
