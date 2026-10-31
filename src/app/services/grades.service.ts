import { Injectable, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Subject } from '../models/studyProfile';

export type GradesMap = Record<string, number | null>;
export type OptionsMap = Record<string, string>;

@Injectable({
  providedIn: 'root',
})
export class GradesService {
  private readonly firebase = inject(FirebaseService);
  private readonly authService = inject(AuthService);

  public readonly isSyncing = signal<boolean>(false);
  public readonly lastSyncedAt = signal<string | null>(null);

  private saveTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  private getDocId(curriculumKey: string): string {
    return curriculumKey.replace(/[\/\\]/g, '_');
  }

  /**
   * Loads grades for a given curriculum key.
   * Priority:
   * 1. Reads local storage for instant render.
   * 2. If student is logged in, fetches latest from Firestore and merges.
   */
  public async loadGrades(
    curriculumKey: string,
    subjects: Subject[]
  ): Promise<GradesMap> {
    const initial: GradesMap = {};
    for (const s of subjects) {
      initial[s.name] = null;
    }

    // 1. Local Storage check
    if (typeof localStorage !== 'undefined') {
      try {
        const local = localStorage.getItem(`grades:${curriculumKey}`);
        if (local) {
          const parsed = JSON.parse(local) as GradesMap;
          for (const k of Object.keys(parsed)) {
            if (k in initial) {
              initial[k] = parsed[k];
            }
          }
        }
      } catch {
        // ignore storage errors
      }
    }

    // 2. Cloud Firestore check (if student is logged in)
    const user = this.authService.user();
    if (user && this.firebase.firestore) {
      try {
        this.isSyncing.set(true);
        const docRef = doc(
          this.firebase.firestore,
          'users',
          user.uid,
          'semesterGrades',
          this.getDocId(curriculumKey)
        );
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData && cloudData['grades']) {
            const cloudGrades = cloudData['grades'] as GradesMap;
            for (const k of Object.keys(cloudGrades)) {
              if (k in initial) {
                initial[k] = cloudGrades[k];
              }
            }
            // Update local storage to match cloud
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(`grades:${curriculumKey}`, JSON.stringify(initial));
            }
            if (cloudData['selectedOptions']) {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(
                  `options:${curriculumKey}`,
                  JSON.stringify(cloudData['selectedOptions'])
                );
              }
            }
            this.lastSyncedAt.set(cloudData['updatedAt'] ?? new Date().toLocaleTimeString());
          }
        }
      } catch (err) {
        console.warn('[GradesService] Could not fetch grades from cloud:', err);
      } finally {
        this.isSyncing.set(false);
      }
    }

    return initial;
  }

  /**
   * Loads selected elective/optional course options for a given curriculum key.
   */
  public async loadOptions(curriculumKey: string): Promise<OptionsMap> {
    const initial: OptionsMap = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const local = localStorage.getItem(`options:${curriculumKey}`);
        if (local) {
          return JSON.parse(local) as OptionsMap;
        }
      } catch {
        // ignore storage errors
      }
    }
    return initial;
  }

  /**
   * Saves options locally.
   */
  public saveOptionsLocally(curriculumKey: string, options: OptionsMap): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`options:${curriculumKey}`, JSON.stringify(options));
      } catch {
        // ignore storage errors
      }
    }
  }

  /**
   * Saves grades to local storage immediately without writing to Firestore.
   */
  public saveGradesLocally(curriculumKey: string, grades: GradesMap): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`grades:${curriculumKey}`, JSON.stringify(grades));
      } catch {
        // ignore storage errors
      }
    }
  }

  /**
   * Default save: preserves changes locally in the browser immediately.
   */
  public saveGrades(curriculumKey: string, grades: GradesMap): void {
    this.saveGradesLocally(curriculumKey, grades);
  }

  /**
   * Explicitly syncs grades to Firestore in the cloud when user clicks the save button.
   */
  public async saveGradesToCloud(
    curriculumKey: string,
    grades: GradesMap,
    options?: OptionsMap
  ): Promise<boolean> {
    this.saveGradesLocally(curriculumKey, grades);
    if (options) {
      this.saveOptionsLocally(curriculumKey, options);
    }

    const user = this.authService.user();
    if (!user || !this.firebase.firestore) {
      return false;
    }

    try {
      this.isSyncing.set(true);
      const docRef = doc(
        this.firebase.firestore,
        'users',
        user.uid,
        'semesterGrades',
        this.getDocId(curriculumKey)
      );

      const now = new Date().toISOString();
      const currentOpts = options ?? (await this.loadOptions(curriculumKey));
      await setDoc(docRef, {
        curriculumKey,
        grades,
        selectedOptions: currentOpts,
        updatedAt: now,
      });

      this.lastSyncedAt.set(new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      console.error('[GradesService] Failed to sync grades to Firestore:', err);
      throw err;
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Clears grades locally and in Firestore for the active semester.
   */
  public async clearGrades(curriculumKey: string, subjects: Subject[]): Promise<GradesMap> {
    const cleared: GradesMap = {};
    for (const s of subjects) {
      cleared[s.name] = null;
    }

    this.saveGradesLocally(curriculumKey, cleared);

    const user = this.authService.user();
    if (user && this.firebase.firestore) {
      try {
        this.isSyncing.set(true);
        const docRef = doc(
          this.firebase.firestore,
          'users',
          user.uid,
          'semesterGrades',
          this.getDocId(curriculumKey)
        );
        const now = new Date().toISOString();
        await setDoc(docRef, {
          curriculumKey,
          grades: cleared,
          updatedAt: now,
        });
        this.lastSyncedAt.set(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('[GradesService] Failed to clear grades from cloud:', err);
      } finally {
        this.isSyncing.set(false);
      }
    }

    return cleared;
  }
}
