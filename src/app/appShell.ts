import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './appShell.html',
  styleUrls: ['./appShell.css'],
})
export class AppShell {
  protected readonly authService = inject(AuthService);
  protected readonly title = signal('Calculator Medie Ponderată — Inginerie');
  protected readonly currentYear = new Date().getFullYear();

  protected async logout() {
    await this.authService.logout();
  }
}
