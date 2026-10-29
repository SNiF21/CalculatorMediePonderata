import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './appShell.html',
})
export class AppShell {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly title = signal('Calculator Medie Ponderată — Inginerie');
  protected readonly currentYear = new Date().getFullYear();

  // Email verification barrier state
  protected readonly isCheckingVerification = signal<boolean>(false);
  protected readonly isResending = signal<boolean>(false);
  protected readonly verificationNotice = signal<string | null>(null);
  protected readonly verificationError = signal<string | null>(null);

  protected async checkVerification(): Promise<void> {
    this.isCheckingVerification.set(true);
    this.verificationNotice.set(null);
    this.verificationError.set(null);
    try {
      await this.authService.reloadUser();
      if (this.authService.isEmailVerified()) {
        this.verificationNotice.set('Adresa ta de email a fost confirmată! Aplicația este acum deblocată.');
      } else {
        this.verificationError.set('Adresa nu este încă validată. Asigură-te că ai dat click pe linkul din email.');
      }
    } catch (err: unknown) {
      this.verificationError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isCheckingVerification.set(false);
    }
  }

  protected async resendVerification(): Promise<void> {
    this.isResending.set(true);
    this.verificationNotice.set(null);
    this.verificationError.set(null);
    try {
      await this.authService.sendVerificationEmail();
      this.verificationNotice.set(
        'Un nou email de validare a fost expediat către ' + this.authService.studentEmail() + '. Verifică inbox-ul.'
      );
    } catch (err: unknown) {
      this.verificationError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isResending.set(false);
    }
  }

  protected async logout() {
    await this.authService.logout();
  }
}
