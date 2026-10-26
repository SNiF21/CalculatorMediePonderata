import { Injectable, computed, inject, signal } from '@angular/core';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { StudentProfile } from '../models/user.model';
import { SemesterRoman, StudyMajor, YearRoman } from '../models/studyProfile';
import { environment } from '../../environments/environment';

export const INSTITUTIONAL_DOMAIN = environment.institutionalDomain || 'ulbsibiu.ro';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebase = inject(FirebaseService);

  public readonly user = signal<User | null>(null);
  public readonly profile = signal<StudentProfile | null>(null);
  public readonly loading = signal<boolean>(true);
  public readonly isConfigured = this.firebase.isConfigured;

  public readonly isLoggedIn = computed(() => this.user() !== null);
  public readonly studentEmail = computed(() => this.user()?.email ?? '');

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    if (!this.firebase.auth) {
      this.loading.set(false);
      return;
    }

    onAuthStateChanged(this.firebase.auth, async (user) => {
      this.user.set(user);
      if (user) {
        await this.loadUserProfile(user.uid, user.email ?? '');
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    });
  }

  /**
   * Validates whether an email belongs strictly to the institutional domain (@ulbsibiu.ro).
   */
  public isValidInstitutionalEmail(email: string): boolean {
    if (!email) return false;
    const trimmed = email.trim().toLowerCase();
    const parts = trimmed.split('@');
    return parts.length === 2 && parts[0].length > 0 && parts[1] === INSTITUTIONAL_DOMAIN;
  }

  /**
   * Registers a new student account using institutional email, password, and chosen study profile.
   */
  public async register(
    email: string,
    pass: string,
    initialProfile?: {
      major?: StudyMajor;
      year?: YearRoman;
      semester?: SemesterRoman;
    }
  ): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();

    if (!this.isValidInstitutionalEmail(cleanEmail)) {
      throw new Error(`Înregistrarea este permisă doar cu adresa instituțională (@${INSTITUTIONAL_DOMAIN}).`);
    }

    if (!this.firebase.auth) {
      throw new Error('Serviciul Firebase nu este configurat în src/environments/environment.ts.');
    }

    const cred = await createUserWithEmailAndPassword(this.firebase.auth, cleanEmail, pass);
    const user = cred.user;

    // Create student profile in Firestore
    const studentProfile: StudentProfile = {
      uid: user.uid,
      email: cleanEmail,
      institutionalDomain: 'ulbsibiu.ro',
      createdAt: new Date().toISOString(),
      major: initialProfile?.major ?? 'Calculatoare',
      year: initialProfile?.year ?? 'I',
      semester: initialProfile?.semester ?? 'Semestrul I',
    };

    await this.saveUserProfile(studentProfile);
    this.profile.set(studentProfile);

    return user;
  }

  /**
   * Logs in an existing student account.
   */
  public async login(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();

    if (!this.isValidInstitutionalEmail(cleanEmail)) {
      throw new Error(`Autentificarea este permisă doar cu adresa instituțională (@${INSTITUTIONAL_DOMAIN}).`);
    }

    if (!this.firebase.auth) {
      throw new Error('Serviciul Firebase nu este configurat în src/environments/environment.ts.');
    }

    const cred = await signInWithEmailAndPassword(this.firebase.auth, cleanEmail, pass);
    await this.loadUserProfile(cred.user.uid, cleanEmail);
    return cred.user;
  }

  /**
   * Logs out the current student.
   */
  public async logout(): Promise<void> {
    if (!this.firebase.auth) return;
    await signOut(this.firebase.auth);
    this.user.set(null);
    this.profile.set(null);
  }

  /**
   * Sends a password reset email for an institutional account.
   */
  public async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    if (!this.isValidInstitutionalEmail(cleanEmail)) {
      throw new Error(`Introduceți o adresă instituțională validă (@${INSTITUTIONAL_DOMAIN}).`);
    }

    if (!this.firebase.auth) {
      throw new Error('Serviciul Firebase nu este configurat în src/environments/environment.ts.');
    }

    await sendPasswordResetEmail(this.firebase.auth, cleanEmail);
  }

  /**
   * Loads or creates a student profile in Firestore.
   */
  private async loadUserProfile(uid: string, email: string): Promise<void> {
    if (!this.firebase.firestore) return;

    try {
      const userRef = doc(this.firebase.firestore, 'users', uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as StudentProfile;
        // Ensure defaults if existing doc lacks fields
        this.profile.set({
          ...data,
          major: data.major ?? 'Calculatoare',
          year: data.year ?? 'I',
          semester: data.semester ?? 'Semestrul I',
        });
      } else {
        // Initial profile creation if doc doesn't exist yet
        const newProfile: StudentProfile = {
          uid,
          email,
          institutionalDomain: 'ulbsibiu.ro',
          createdAt: new Date().toISOString(),
          major: 'Calculatoare',
          year: 'I',
          semester: 'Semestrul I',
        };
        await setDoc(userRef, newProfile);
        this.profile.set(newProfile);
      }
    } catch (err) {
      console.warn('[AuthService] Could not load profile from Firestore:', err);
    }
  }

  /**
   * Saves or updates a student profile in Firestore.
   */
  public async saveUserProfile(profileData: Partial<StudentProfile> & { uid: string }): Promise<void> {
    if (!this.firebase.firestore) return;
    try {
      const userRef = doc(this.firebase.firestore, 'users', profileData.uid);
      await setDoc(userRef, profileData, { merge: true });
      this.profile.update((curr) => (curr ? { ...curr, ...profileData } : (profileData as StudentProfile)));
    } catch (err) {
      console.error('[AuthService] Error updating user profile:', err);
      throw err;
    }
  }

  /**
   * Helper to format Firebase error codes into clear Romanian error messages.
   */
  public formatErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = String((error as { code: string }).code);
      switch (code) {
        case 'auth/invalid-email':
          return 'Adresa de email este invalidă.';
        case 'auth/user-disabled':
          return 'Acest cont a fost dezactivat.';
        case 'auth/user-not-found':
          return 'Nu există niciun cont asociat acestei adrese.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Emailul sau parola sunt incorecte.';
        case 'auth/email-already-in-use':
          return 'Un cont cu această adresă instituțională există deja.';
        case 'auth/weak-password':
          return 'Parola trebuie să conțină cel puțin 6 caractere.';
        case 'auth/network-request-failed':
          return 'Eroare de rețea. Te rugăm să verifici conexiunea la internet.';
        case 'auth/too-many-requests':
          return 'Prea multe încercări consecutive. Te rugăm să încerci din nou mai târziu.';
        default:
          return (error as { message?: string }).message || 'A apărut o eroare la autentificare.';
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'A apărut o eroare neașteptată.';
  }
}
