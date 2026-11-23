import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastMessage } from './shared/components/toast-message/toast-message';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastMessage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tixly-admin');
}
