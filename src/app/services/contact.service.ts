import { Injectable, inject } from '@angular/core';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';

export type ContactCategory =
  | 'credite'
  | 'tehnic'
  | 'sugestie'
  | 'general';

export interface ContactSubmission {
  id?: string;
  name?: string;
  email: string;
  category: ContactCategory;
  faculty?: string;
  department?: string;
  major?: string;
  year?: string;
  subjectTitle: string;
  message: string;
  createdAt?: string;
  status?: 'nou' | 'in_analiza' | 'rezolvat';
}

export interface SubmissionResponse {
  success: boolean;
  ticketId: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly firebase = inject(FirebaseService);

  private readonly storageKey = 'user_contact_submissions';
  private memorySubmissions: ContactSubmission[] = [];

  /**
   * Submits a new contact/feedback report.
   * If Firestore is initialized, saves to 'contact_submissions' collection.
   * Always persists to localStorage as a local receipt.
   */
  public async submitMessage(submission: ContactSubmission): Promise<SubmissionResponse> {
    const trimmedEmail = submission.email.trim();
    const trimmedTitle = submission.subjectTitle.trim();
    const trimmedMessage = submission.message.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Te rugăm să introduci o adresă de email validă.');
    }

    if (!trimmedTitle || trimmedTitle.length < 3) {
      throw new Error('Subiectul trebuie să aibă cel puțin 3 caractere.');
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      throw new Error('Descrierea problemei trebuie să conțină cel puțin 10 caractere.');
    }

    const ticketId = `TIC-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const record: ContactSubmission = {
      ...submission,
      id: ticketId,
      email: trimmedEmail,
      subjectTitle: trimmedTitle,
      message: trimmedMessage,
      createdAt: nowIso,
      status: 'nou',
    };

    // 1. Try to save to Firestore if configured (filter out undefined values)
    if (this.firebase.firestore) {
      try {
        const firestoreData: Record<string, unknown> = {
          serverTimestamp: serverTimestamp(),
        };
        for (const [key, value] of Object.entries(record)) {
          if (value !== undefined) {
            firestoreData[key] = value;
          }
        }
        await addDoc(collection(this.firebase.firestore, 'contact_submissions'), firestoreData);
      } catch (err) {
        console.warn('[ContactService] Could not persist to Firestore, stored locally instead:', err);
      }
    }

    // 2. Persist in memory and localStorage
    this.memorySubmissions.unshift(record);
    this.saveToLocalStorage(record);

    // 3. Dispatch email notification via Web3Forms (if configured)
    await this.sendEmailNotification(record);

    return {
      success: true,
      ticketId,
      message: 'Sesizarea ta a fost trimisă cu succes! Îți mulțumim pentru contribuție.',
    };
  }

  /**
   * Dispatches an email notification to the administrator via Web3Forms API.
   */
  private async sendEmailNotification(record: ContactSubmission): Promise<void> {
    const accessKey = environment.web3forms?.accessKey;
    if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      return;
    }

    const categoryLabels: Record<ContactCategory, string> = {
      credite: 'Problemă Credite ECTS / Materii',
      tehnic: 'Eroare Tehnică / Bug',
      sugestie: 'Sugestie de Îmbunătățire',
      general: 'Solicitare Generală',
    };

    const categoryLabel = categoryLabels[record.category] ?? record.category;

    try {
      const payload = {
        access_key: accessKey,
        subject: `[Tichet Medie ULBS ${record.id}] ${categoryLabel}: ${record.subjectTitle}`,
        from_name: record.name ? `${record.name} (Student ULBS)` : 'Student Medie ULBS',
        replyto: record.email,
        ticket_id: record.id,
        categorie: categoryLabel,
        student_email: record.email,
        student_nume: record.name || 'Nespecificat',
        facultate: record.faculty || 'Nespecificat',
        specializare: record.major || 'Nespecificat',
        an_studiu: record.year || 'Nespecificat',
        subiect: record.subjectTitle,
        mesaj: record.message,
        data_creare: new Date().toLocaleString('ro-RO'),
      };

      if (typeof fetch !== 'undefined') {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.warn('[ContactService] Web3Forms response status:', response.status, data);
        }
      }
    } catch (err) {
      console.warn('[ContactService] Could not deliver email notification (offline/network):', err);
    }
  }

  /**
   * Retrieves previous submissions stored locally on this device.
   */
  public getLocalSubmissions(): ContactSubmission[] {
    let localItems: ContactSubmission[] = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          localItems = JSON.parse(data) as ContactSubmission[];
        }
      } catch {
        // ignore localStorage errors in non-browser envs
      }
    }

    if (localItems.length === 0 && this.memorySubmissions.length > 0) {
      return [...this.memorySubmissions];
    }

    return localItems;
  }

  private saveToLocalStorage(record: ContactSubmission): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const existing = this.getLocalSubmissions();
      existing.unshift(record);
      // Keep at most 20 recent submissions
      localStorage.setItem(this.storageKey, JSON.stringify(existing.slice(0, 20)));
    } catch (e) {
      console.warn('[ContactService] Error saving to localStorage:', e);
    }
  }
}
