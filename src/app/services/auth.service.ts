import { Injectable, computed, inject, signal } from '@angular/core';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
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
  
  private readonly verifiedOverride = signal<boolean | null>(null);
  public readonly isEmailVerified = computed<boolean>(() => {
    if (this.verifiedOverride() !== null) {
      return this.verifiedOverride()!;
    }
    return this.user()?.emailVerified ?? false;
  });

  constructor() {
    this.initAuthListener();
    this.initFocusListener();
  }

  private initAuthListener() {
    if (!this.firebase.auth) {
      this.loading.set(false);
      return;
    }

    onAuthStateChanged(this.firebase.auth, async (user) => {
      this.verifiedOverride.set(null);
      this.user.set(user);

      if (user) {
        // If cached state was not verified, do a quick server reload check
        if (!user.emailVerified) {
          try {
            await user.reload();
            this.verifiedOverride.set(user.emailVerified);
          } catch {
            // Ignore offline/network reload error
          }
        }
        await this.loadUserProfile(user.uid, user.email ?? '');
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    });
  }

  private initFocusListener() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const checkOnActive = () => {
        if (this.isLoggedIn() && !this.isEmailVerified()) {
          this.reloadUser().catch(() => {});
        }
      };

      window.addEventListener('focus', checkOnActive);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkOnActive();
        }
      });
    }
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

    // Send email verification to the student's institutional address
    try {
      await sendEmailVerification(user);
    } catch (verErr) {
      console.warn('Nu s-a putut trimite automat emailul de verificare:', verErr);
    }

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
   * Sends an email verification to the currently logged in student.
   */
  public async sendVerificationEmail(): Promise<void> {
    const currentUser = this.firebase.auth?.currentUser;
    if (!currentUser) {
      throw new Error('Nu există un utilizator autentificat.');
    }
    await sendEmailVerification(currentUser);
  }

  /**
   * Reloads the user session to refresh the emailVerified property.
   */
  public async reloadUser(): Promise<User | null> {
    const currentUser = this.firebase.auth?.currentUser;
    if (currentUser) {
      // 1. Force server reload of current user details
      await currentUser.reload();

      // 2. Refresh JWT token to sync updated claims
      try {
        await currentUser.getIdToken(true);
      } catch {
        // ignore token refresh network error
      }

      // 3. Directly update verifiedOverride signal
      const verified = currentUser.emailVerified;
      this.verifiedOverride.set(verified);

      // 4. Create shallow copy preserving prototype to trigger signal inequality check
      const freshUser = Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser);
      this.user.set(freshUser);

      return freshUser;
    }
    return null;
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
    this.verifiedOverride.set(null);
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
   * Changes the student's password after re-authenticating with their current password.
   */
  public async changePassword(currentPass: string, newPass: string): Promise<void> {
    const user = this.user();
    if (!user || !user.email) {
      throw new Error('Utilizatorul nu este autentificat.');
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('Noua parolă trebuie să aibă minimum 6 caractere.');
    }

    // Re-authenticate user
    const cred = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, cred);

    // Update password
    await updatePassword(user, newPass);
  }

  /**
   * Deletes the student account and all associated Firestore data after password confirmation.
   */
  public async deleteAccount(currentPass: string): Promise<void> {
    const user = this.user();
    if (!user || !user.email) {
      throw new Error('Utilizatorul nu este autentificat.');
    }

    // Re-authenticate user with current password
    const cred = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, cred);

    // 1. Delete all semester grades subcollection documents in Firestore
    if (this.firebase.firestore) {
      try {
        const gradesCol = collection(this.firebase.firestore, 'users', user.uid, 'semesterGrades');
        const gradesSnap = await getDocs(gradesCol);
        for (const gradeDoc of gradesSnap.docs) {
          await deleteDoc(gradeDoc.ref);
        }

        // 2. Delete user profile document in Firestore
        const userRef = doc(this.firebase.firestore, 'users', user.uid);
        await deleteDoc(userRef);
      } catch (err) {
        console.warn('[AuthService] Could not completely delete Firestore data:', err);
      }
    }

    // 3. Clear local storage items for grades and study context
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('grades:') || key.startsWith('study_context:'))) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore storage errors
      }
    }

    // 4. Delete user in Firebase Authentication
    await deleteUser(user);
    this.user.set(null);
    this.profile.set(null);
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
          return 'Parola introdusă este incorectă.';
        case 'auth/email-already-in-use':
          return 'Un cont cu această adresă instituțională există deja.';
        case 'auth/weak-password':
          return 'Parola trebuie să conțină cel puțin 6 caractere.';
        case 'auth/network-request-failed':
          return 'Eroare de rețea. Te rugăm să verifici conexiunea la internet.';
        case 'auth/too-many-requests':
          return 'Prea multe încercări consecutive. Te rugăm să încerci din nou mai târziu.';
        case 'auth/requires-recent-login':
          return 'Pentru această acțiune este necesară o reautentificare recentă.';
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
