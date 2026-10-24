import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly appInstance: FirebaseApp | null = null;
  public readonly auth: Auth | null = null;
  public readonly firestore: Firestore | null = null;
  public readonly isConfigured = signal<boolean>(false);

  constructor() {
    const config = environment.firebase;
    const hasValidConfig =
      Boolean(config.apiKey) &&
      config.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
      Boolean(config.projectId) &&
      config.projectId !== 'YOUR_PROJECT_ID';

    if (hasValidConfig) {
      try {
        this.appInstance = getApps().length === 0 ? initializeApp(config) : getApp();
        this.auth = getAuth(this.appInstance);
        this.firestore = getFirestore(this.appInstance);
        this.isConfigured.set(true);
      } catch (error) {
        console.error('[FirebaseService] Error initializing Firebase:', error);
        this.isConfigured.set(false);
      }
    } else {
      console.warn(
        '[FirebaseService] Firebase credentials are not yet configured. Update src/environments/environment.ts to enable authentication.'
      );
      this.isConfigured.set(false);
    }
  }

  public getApp(): FirebaseApp | null {
    return this.appInstance;
  }
}
