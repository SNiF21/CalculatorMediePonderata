import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.html',
})
export class ChangePasswordModalComponent {
  private readonly authService = inject(AuthService);

  public readonly closeModal = output<void>();

  protected readonly currentPassword = signal<string>('');
  protected readonly newPassword = signal<string>('');
  protected readonly confirmNewPassword = signal<string>('');
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly isChangingPassword = signal<boolean>(false);

  protected close(): void {
    this.closeModal.emit();
  }

  protected async submitPasswordChange(): Promise<void> {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    const current = this.currentPassword();
    const next = this.newPassword();
    const confirm = this.confirmNewPassword();

    if (!current) {
      this.passwordError.set('Introdu parola actuală.');
      return;
    }

    if (!next || next.length < 6) {
      this.passwordError.set('Noua parolă trebuie să aibă minimum 6 caractere.');
      return;
    }

    if (next !== confirm) {
      this.passwordError.set('Parolele noi introduse nu coincid.');
      return;
    }

    this.isChangingPassword.set(true);
    try {
      await this.authService.changePassword(current, next);
      this.passwordSuccess.set('Parola a fost modificată cu succes!');
      setTimeout(() => {
        this.close();
      }, 1500);
    } catch (err: unknown) {
      this.passwordError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isChangingPassword.set(false);
    }
  }
}
