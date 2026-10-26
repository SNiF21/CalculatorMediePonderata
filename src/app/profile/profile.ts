import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudyContextService } from '../services/study-context.service';
import { SemesterRoman, StudyMajor, YearRoman } from '../models/studyProfile';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  protected readonly studyContext = inject(StudyContextService);
  private readonly router = inject(Router);

  // Password change modal state
  protected readonly showPasswordModal = signal<boolean>(false);
  protected readonly currentPassword = signal<string>('');
  protected readonly newPassword = signal<string>('');
  protected readonly confirmNewPassword = signal<string>('');
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly isChangingPassword = signal<boolean>(false);

  // Delete account modal state
  protected readonly showDeleteModal = signal<boolean>(false);
  protected readonly deletePassword = signal<string>('');
  protected readonly deleteError = signal<string | null>(null);
  protected readonly isDeletingAccount = signal<boolean>(false);

  // Success banners
  protected readonly profileUpdateSuccess = signal<boolean>(false);

  // Student email & profile computed
  protected readonly user = this.authService.user;
  protected readonly studentEmail = computed(() => this.user()?.email ?? '');

  // Email verification state
  protected readonly isSendingVerification = signal<boolean>(false);
  protected readonly verificationSuccess = signal<string | null>(null);
  protected readonly verificationError = signal<string | null>(null);

  protected async sendVerificationEmail(): Promise<void> {
    this.isSendingVerification.set(true);
    this.verificationSuccess.set(null);
    this.verificationError.set(null);
    try {
      await this.authService.sendVerificationEmail();
      this.verificationSuccess.set(
        'Un nou link de confirmare a fost trimis către ' + this.studentEmail() + '. Verifică inbox-ul (și dosarul Spam).'
      );
    } catch (err: unknown) {
      this.verificationError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isSendingVerification.set(false);
    }
  }

  protected async checkEmailVerification(): Promise<void> {
    this.verificationSuccess.set(null);
    this.verificationError.set(null);
    try {
      await this.authService.reloadUser();
      if (this.authService.isEmailVerified()) {
        this.verificationSuccess.set('Adresa ta instituțională a fost confirmată cu succes!');
      } else {
        this.verificationError.set('Adresa nu a fost încă validată. Verifică căsuța poștală sau apasă „Retrimite email”.');
      }
    } catch (err: unknown) {
      this.verificationError.set(this.authService.formatErrorMessage(err));
    }
  }

  // Quick setters for study context
  protected onMajorChange(major: StudyMajor): void {
    this.studyContext.setMajor(major);
    this.flashSuccess();
  }

  protected onYearChange(year: YearRoman): void {
    this.studyContext.setYear(year);
    this.flashSuccess();
  }

  protected onSemesterChange(semester: SemesterRoman): void {
    this.studyContext.setSemester(semester);
    this.flashSuccess();
  }

  private flashSuccess(): void {
    this.profileUpdateSuccess.set(true);
    setTimeout(() => this.profileUpdateSuccess.set(false), 2000);
  }

  // --- Password Change Methods ---
  protected openPasswordModal(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmNewPassword.set('');
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.showPasswordModal.set(true);
  }

  protected closePasswordModal(): void {
    this.showPasswordModal.set(false);
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
        this.closePasswordModal();
      }, 1500);
    } catch (err: unknown) {
      this.passwordError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  // --- Logout Method ---
  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  // --- Delete Account Methods ---
  protected openDeleteModal(): void {
    this.deletePassword.set('');
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  protected closeDeleteModal(): void {
    this.showDeleteModal.set(false);
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
      this.closeDeleteModal();
      this.router.navigate(['/']);
    } catch (err: unknown) {
      this.deleteError.set(this.authService.formatErrorMessage(err));
    } finally {
      this.isDeletingAccount.set(false);
    }
  }
}
