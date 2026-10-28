import { Component, signal } from '@angular/core';
import { AppShell } from './appShell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('MediePonderataULBS');
}
