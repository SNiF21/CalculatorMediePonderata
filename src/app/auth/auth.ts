import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, INSTITUTIONAL_DOMAIN } from '../services/auth.service';
import {
  DEFAULT_DEPARTMENT,
  DEFAULT_FACULTY,
  FACULTIES,
  STUDY_MAJORS,
  STUDY_SEMESTERS,
  STUDY_YEARS,
  SemesterRoman,
  StudyMajor,
  YearRoman,
  getDepartmentsForFaculty,
  getMajorsForDepartment,
} from '../models/studyProfile';
import { StudyContextService } from '../services/study-context.service';

type AuthMode = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
})
export class AuthComponent {
  protected readonly authService = inject(AuthService);
  protected readonly studyContext = inject(StudyContextService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);

  // Profile options for registration
  protected readonly faculties = FACULTIES;
  protected readonly years = STUDY_YEARS;
  protected readonly semesters = STUDY_SEMESTERS;

  protected readonly selectedFaculty = signal<string>(DEFAULT_FACULTY);
  protected readonly availableDepartments = computed(() =>
    getDepartmentsForFaculty(this.selectedFaculty())
  );
  protected readonly selectedDepartment = signal<string>(DEFAULT_DEPARTMENT);
  protected readonly availableMajors = computed(() =>
    getMajorsForDepartment(this.selectedFaculty(), this.selectedDepartment())
  );

  protected readonly selectedMajor = signal<StudyMajor>('Calculatoare');
  protected readonly selectedYear = signal<YearRoman>('I');
  protected readonly selectedSemester = signal<SemesterRoman>('Semestrul I');

  protected onFacultyChange(facultyName: string) {
    this.selectedFaculty.set(facultyName);
    const depts = getDepartmentsForFaculty(facultyName);
    if (depts.length > 0) {
      const firstDept = depts[0].shortName;
      this.selectedDepartment.set(firstDept);
      const majors = getMajorsForDepartment(facultyName, firstDept);
      if (majors.length > 0) {
        this.selectedMajor.set(majors[0]);
      }
    }
  }

  protected onDepartmentChange(departmentShortOrName: string) {
    this.selectedDepartment.set(departmentShortOrName);
    const majors = getMajorsForDepartment(this.selectedFaculty(), departmentShortOrName);
    if (majors.length > 0 && !majors.includes(this.selectedMajor())) {
      this.selectedMajor.set(majors[0]);
    }
  }

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
        await this.authService.register(emailVal, passVal, {
          faculty: this.selectedFaculty(),
          department: this.selectedDepartment(),
          major: this.selectedMajor(),
          year: this.selectedYear(),
          semester: this.selectedSemester(),
        });
        // Immediately set context in the app
        this.studyContext.setProfile(
          this.selectedMajor(),
          this.selectedYear(),
          this.selectedSemester(),
          this.selectedFaculty(),
          this.selectedDepartment()
        );
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
