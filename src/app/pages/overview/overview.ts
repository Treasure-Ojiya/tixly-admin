import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDashboard } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

@Component({
  selector: 'app-overview',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  private readonly appService = inject(AppService);

  readonly today = new Date();

  readonly data = signal<AdminDashboard | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly avgPerTicket = computed(() => {
    const d = this.data();
    return d && d.total_tickets_sold > 0 ? d.total_revenue / d.total_tickets_sold : 0;
  });

  readonly activeShare = computed(() => this.share(this.data()?.active_events));
  readonly upcomingShare = computed(() => this.share(this.data()?.upcoming_events));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.appService.getDashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('The events could not be loaded.');
        this.isLoading.set(false);
        // your toast call here, e.g. this.toast.error(...)
      },
    });
  }

  private share(count: number | undefined): number {
    const total = this.data()?.total_events ?? 0;
    if (!count || total <= 0) return 0;
    return Math.min(100, Math.round((count / total) * 100));
  }
}
