import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudyContextService } from '../services/study-context.service';
import { ContactCategory, ContactService, ContactSubmission } from '../services/contact.service';

export interface CategoryOption {
  id: ContactCategory;
  title: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact.html',
})
export class ContactComponent {
  protected readonly authService = inject(AuthService);
  protected readonly studyContext = inject(StudyContextService);
  protected readonly contactService = inject(ContactService);

  // Form Signals
  public readonly name = signal<string>('');
  public readonly email = signal<string>('');
  public readonly category = signal<ContactCategory>('credite');
  public readonly faculty = signal<string>('');
  public readonly major = signal<string>('');
  public readonly year = signal<string>('');
  public readonly subjectTitle = signal<string>('');
  public readonly message = signal<string>('');

  // Status Signals
  public readonly isSubmitting = signal<boolean>(false);
  public readonly submitSuccess = signal<string | null>(null);
  public readonly submitError = signal<string | null>(null);
  public readonly ticketId = signal<string | null>(null);
  public readonly formSubmitted = signal<boolean>(false);

  // Recent local submissions list
  public readonly recentSubmissions = signal<ContactSubmission[]>([]);

  public readonly categories: CategoryOption[] = [
    {
      id: 'credite',
      title: 'Problemă credite ECTS / Plan de învățământ',
      description: 'Credite eronate, disciplină lipsă, denumire sau tip de examinare greșite.',
      badge: 'Credite & Materii',
    },
    {
      id: 'tehnic',
      title: 'Eroare sau problemă tehnică',
      description: 'Bug în aplicație, blocaj la salvare, eroare de afișare sau de calcul.',
      badge: 'Bug Tehnic',
    },
    {
      id: 'sugestie',
      title: 'Sugestie de îmbunătățire',
      description: 'O idee nouă pentru aplicație, o funcționalitate utilă sau o specializare nouă.',
      badge: 'Sugestie',
    },
    {
      id: 'general',
      title: 'Altceva / Întrebare',
      description: 'Orice altă solicitare, feedback sau întrebare legată de proiect.',
      badge: 'General',
    },
  ];

  constructor() {
    // Pre-fill fields based on context
    const studentEmail = this.authService.studentEmail();
    if (studentEmail) {
      this.email.set(studentEmail);
    }

    this.faculty.set(this.studyContext.faculty());
    this.major.set(this.studyContext.major());
    this.year.set(this.studyContext.yearLabel());

    this.loadRecentSubmissions();
  }

  public selectCategory(cat: ContactCategory): void {
    this.category.set(cat);
  }

  public isEmailValid(): boolean {
    const trimmed = this.email().trim();
    return trimmed.length > 0 && trimmed.includes('@');
  }

  public isSubjectValid(): boolean {
    return this.subjectTitle().trim().length >= 3;
  }

  public isMessageValid(): boolean {
    return this.message().trim().length >= 10;
  }

  public async onSubmit(): Promise<void> {
    this.formSubmitted.set(true);

    if (!this.isEmailValid()) {
      this.submitError.set('Te rugăm să introduci o adresă de email validă.');
      return;
    }

    if (!this.isSubjectValid()) {
      this.submitError.set('Subiectul trebuie să aibă cel puțin 3 caractere.');
      return;
    }

    if (!this.isMessageValid()) {
      this.submitError.set('Descrierea problemei trebuie să conțină cel puțin 10 caractere.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(null);

    try {
      const submission: ContactSubmission = {
        name: this.name().trim() || undefined,
        email: this.email().trim(),
        category: this.category(),
        faculty: this.category() === 'credite' ? this.faculty().trim() : undefined,
        major: this.category() === 'credite' ? this.major().trim() : undefined,
        year: this.category() === 'credite' ? this.year().trim() : undefined,
        subjectTitle: this.subjectTitle().trim(),
        message: this.message().trim(),
      };

      const res = await this.contactService.submitMessage(submission);
      this.submitSuccess.set(res.message);
      this.ticketId.set(res.ticketId);

      this.loadRecentSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'A apărut o eroare necunoscută la trimiterea mesajului.';
      this.submitError.set(msg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public resetForm(): void {
    this.subjectTitle.set('');
    this.message.set('');
    this.submitSuccess.set(null);
    this.submitError.set(null);
    this.ticketId.set(null);
    this.formSubmitted.set(false);
  }

  private loadRecentSubmissions(): void {
    this.recentSubmissions.set(this.contactService.getLocalSubmissions());
  }
}

