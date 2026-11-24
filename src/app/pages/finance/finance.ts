import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminFetchFinance } from '../../app-model/model';
import { AppService } from '../../../app/core/services/app-service/app-service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './finance.html',
})
export class Finance implements OnInit {
  private readonly appService = inject(AppService);
  // private readonly toast = inject(ToastService);  // wire your toast here

  readonly finance = signal<AdminFetchFinance | null>(null);
  readonly financeLoading = signal(true);
  readonly financeError = signal('');

  ngOnInit(): void {
    this.loadFinance();
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
}
