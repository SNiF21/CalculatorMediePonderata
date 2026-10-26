import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  STUDY_MAJORS,
  STUDY_SEMESTERS,
  STUDY_YEARS,
  SemesterRoman,
  StudyMajor,
  Subject,
  YearRoman,
  buildCurriculumKey,
} from '../models/studyProfile';
import { CURRICULUM_DATA } from '../data/curriculumData';
import { AuthService } from './auth.service';

const STORAGE_KEYS = {
  MAJOR: 'study_context:major',
  YEAR: 'study_context:year',
  SEMESTER: 'study_context:semester',
};

@Injectable({
  providedIn: 'root',
})
export class StudyContextService {
  private readonly authService = inject(AuthService);

  public readonly majors = STUDY_MAJORS;
  public readonly years = STUDY_YEARS;
  public readonly semesters = STUDY_SEMESTERS;

  public readonly major = signal<StudyMajor>('Calculatoare');
  public readonly year = signal<YearRoman>('I');
  public readonly semester = signal<SemesterRoman>('Semestrul I');

  public readonly curriculumKey = computed(() =>
    buildCurriculumKey(this.major(), this.year(), this.semester())
  );

  public readonly subjects = computed<Subject[]>(
    () => CURRICULUM_DATA[this.curriculumKey()] ?? []
  );

  public readonly yearLabel = computed(
    () => this.years.find((y) => y.roman === this.year())?.label ?? 'Anul I'
  );

  public readonly semesterShortLabel = computed(
    () =>
      this.semesters.find((s) => s.roman === this.semester())?.shortLabel ??
      'Sem. I'
  );

  constructor() {
    this.initFromLocalStorage();
    this.syncWithAuthProfile();
  }

  private initFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedMajor = localStorage.getItem(STORAGE_KEYS.MAJOR) as StudyMajor | null;
      if (savedMajor && this.majors.includes(savedMajor)) {
        this.major.set(savedMajor);
      }

      const savedYear = localStorage.getItem(STORAGE_KEYS.YEAR) as YearRoman | null;
      if (savedYear && this.years.some((y) => y.roman === savedYear)) {
        this.year.set(savedYear);
      }

      const savedSemester = localStorage.getItem(STORAGE_KEYS.SEMESTER) as SemesterRoman | null;
      if (savedSemester && this.semesters.some((s) => s.roman === savedSemester)) {
        this.semester.set(savedSemester);
      }
    } catch {
      // ignore storage access errors
    }
  }

  private syncWithAuthProfile(): void {
    // Whenever logged in user's profile changes, update active context
    effect(
      () => {
        const profile = this.authService.profile();
        if (profile) {
          if (profile.major && this.majors.includes(profile.major)) {
            this.major.set(profile.major);
          }
          if (profile.year && this.years.some((y) => y.roman === profile.year)) {
            this.year.set(profile.year);
          }
          if (profile.semester && this.semesters.some((s) => s.roman === profile.semester)) {
            this.semester.set(profile.semester);
          }
        }
      }
    );
  }

  public setSemester(sem: SemesterRoman): void {
    this.semester.set(sem);
    this.saveToStorage(STORAGE_KEYS.SEMESTER, sem);
    this.syncToFirestore({ semester: sem });
  }

  public setYear(y: YearRoman): void {
    this.year.set(y);
    this.saveToStorage(STORAGE_KEYS.YEAR, y);
    this.syncToFirestore({ year: y });
  }

  public setMajor(m: StudyMajor): void {
    this.major.set(m);
    this.saveToStorage(STORAGE_KEYS.MAJOR, m);
    this.syncToFirestore({ major: m });
  }

  public setProfile(major: StudyMajor, year: YearRoman, semester: SemesterRoman): void {
    this.major.set(major);
    this.year.set(year);
    this.semester.set(semester);

    this.saveToStorage(STORAGE_KEYS.MAJOR, major);
    this.saveToStorage(STORAGE_KEYS.YEAR, year);
    this.saveToStorage(STORAGE_KEYS.SEMESTER, semester);

    this.syncToFirestore({ major, year, semester });
  }

  private saveToStorage(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  }

  private async syncToFirestore(updates: Partial<{ major: StudyMajor; year: YearRoman; semester: SemesterRoman }>): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    try {
      await this.authService.saveUserProfile({
        uid: user.uid,
        ...updates,
      });
    } catch (err) {
      console.warn('[StudyContextService] Failed to sync study context to Firestore:', err);
    }
  }
}
