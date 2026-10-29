import { Component, signal } from '@angular/core';
import { AppShell } from './layout/appShell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('MediePonderataULBS');
}
