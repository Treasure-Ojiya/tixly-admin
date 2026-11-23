import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSignal = signal<Toast[]>([]);
  toasts = this.toastSignal.asReadonly();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };
    this.toastSignal.update((list) => [...list, toast]);

    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this.toastSignal.update((list) => list.filter((t) => t.id));
  }

  clear() {
    this.toastSignal.set([]);
  }
}
