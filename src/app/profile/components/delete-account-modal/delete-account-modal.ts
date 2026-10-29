import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-account-modal.html',
})
export class DeleteAccountModalComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly closeModal = output<void>();

  protected readonly deletePassword = signal<string>('');
  protected readonly deleteError = signal<string | null>(null);
  protected readonly isDeletingAccount = signal<boolean>(false);

  protected close(): void {
    this.closeModal.emit();
  }

  protected async submitDeleteAccount(): Promise<void> {
    this.deleteError.set(null);
    const pass = this.deletePassword();

    if (!pass) {
      this.deleteError.set('Introdu parola actuală pentru a confirma ștergerea contului.');
      return;
    }

    this.isDeletingAccount.set(true);
    try {
      await this.authService.deleteAccount(pass);
      this.close();
      this.router.navigate(['/']);
    } catch (err: unknown) {
      this.deleteError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isDeletingAccount.set(false);
    }
  }
}
