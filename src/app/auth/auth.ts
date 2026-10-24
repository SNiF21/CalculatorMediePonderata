import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, INSTITUTIONAL_DOMAIN } from '../services/auth.service';

type AuthMode = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class AuthComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly domain = INSTITUTIONAL_DOMAIN;

  protected readonly isDomainValid = computed(() => {
    const val = this.email().trim();
    if (!val) return null;
    return this.authService.isValidInstitutionalEmail(val);
  });

  protected setMode(newMode: AuthMode) {
    this.mode.set(newMode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected appendDomain() {
    const current = this.email().trim();
    if (!current) {
      this.email.set(`@${this.domain}`);
      return;
    }
    if (current.includes('@')) {
      const parts = current.split('@');
      this.email.set(`${parts[0]}@${this.domain}`);
    } else {
      this.email.set(`${current}@${this.domain}`);
    }
  }

  protected toggleShowPassword() {
    this.showPassword.update((val) => !val);
  }

  protected async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const emailVal = this.email().trim();
    const passVal = this.password();

    if (!emailVal) {
      this.errorMessage.set('Te rugăm să introduci adresa de email.');
      return;
    }

    if (!this.authService.isValidInstitutionalEmail(emailVal)) {
      this.errorMessage.set(`Adresa trebuie să aparțină domeniului universitar @${this.domain}.`);
      return;
    }

    if (this.mode() !== 'forgot' && (!passVal || passVal.length < 6)) {
      this.errorMessage.set('Parola trebuie să aibă minimum 6 caractere.');
      return;
    }

    if (this.mode() === 'register') {
      if (passVal !== this.confirmPassword()) {
        this.errorMessage.set('Parolele introduse nu coincid.');
        return;
      }
    }

    this.isSubmitting.set(true);

    try {
      if (this.mode() === 'login') {
        await this.authService.login(emailVal, passVal);
        this.router.navigate(['/calculator']);
      } else if (this.mode() === 'register') {
        await this.authService.register(emailVal, passVal);
        this.router.navigate(['/calculator']);
      } else if (this.mode() === 'forgot') {
        await this.authService.resetPassword(emailVal);
        this.successMessage.set(
          `Un link de resetare a parolei a fost trimis către ${emailVal}. Verifică căsuța poștală.`
        );
      }
    } catch (err: unknown) {
      this.errorMessage.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
