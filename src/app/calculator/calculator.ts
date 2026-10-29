import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudyContextService } from '../services/study-context.service';
import { AuthService } from '../services/auth.service';
import { GradesMap, GradesService } from '../services/grades.service';
import { SemesterRoman, Subject, buildCurriculumKey } from '../models/studyProfile';
import { CURRICULUM_DATA } from '../data/curriculumData';
import { CalculatorResultsComponent } from './components/calculator-results/calculator-results';
import { AnnualResultsComponent } from './components/annual-results/annual-results';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CalculatorResultsComponent,
    AnnualResultsComponent,
  ],
  templateUrl: './calculator.html',
})
export class Calculator {
  protected readonly studyContext = inject(StudyContextService);
  protected readonly authService = inject(AuthService);
  protected readonly gradesService = inject(GradesService);

  public readonly subjects = computed<Subject[]>(() => this.studyContext.subjects());
  public readonly curriculumKey = computed(() => this.studyContext.curriculumKey());

  protected readonly grades = signal<GradesMap>({});

  /**
   * Total credits available in the semester curriculum (typically 30).
   */
  protected readonly totalCredits = computed(() =>
    this.subjects().reduce((s, sub) => s + (sub.credits ?? 0), 0)
  );

  /**
   * Acquired / passed credits: Only subjects where grade >= 5 award credits.
   * If a subject is failed (< 5), its credits are NOT earned.
   */
  public readonly passedCredits = computed(() => {
    let sum = 0;
    const gMap = this.grades();
    for (const sub of this.subjects()) {
      const g = gMap[sub.name];
      if (g != null && g >= 5 && g <= 10) {
        sum += sub.credits;
      }
    }
    return sum;
  });

  /**
   * Failed credits: sum of credits for exams graded < 5.
   */
  public readonly failedCredits = computed(() => {
    let sum = 0;
    const gMap = this.grades();
    for (const sub of this.subjects()) {
      const g = gMap[sub.name];
      if (g != null && g < 5) {
        sum += sub.credits;
      }
    }
    return sum;
  });

  /**
   * Total number of subjects where a grade has been entered.
   */
  protected readonly gradedSubjectsCount = computed(() => {
    const gMap = this.grades();
    return this.subjects().filter((s) => gMap[s.name] != null).length;
  });

  /**
   * True when all subjects have been taken/entered.
   */
  protected readonly allExamsTaken = computed(() => {
    const subs = this.subjects();
    return subs.length > 0 && this.gradedSubjectsCount() === subs.length;
  });

  /**
   * True when all credits of the semester have been successfully passed (e.g. 30 / 30).
   */
  protected readonly allSubjectsPassed = computed(() => {
    const total = this.totalCredits();
    return total > 0 && this.passedCredits() === total;
  });

  protected readonly weightedAverage = computed(() => {
    const subs = this.subjects();
    let weightedSum = 0;
    let creditsSum = 0;
    const gMap = this.grades();

    for (const sub of subs) {
      const g = gMap[sub.name];
      if (g != null && Number.isInteger(g) && g >= 1 && g <= 10) {
        weightedSum += g * sub.credits;
        creditsSum += sub.credits;
      }
    }
    if (creditsSum === 0) return null;
    // Truncate to 2 decimal places without rounding up (e.g. 8.066 -> 8.06)
    return Math.floor((weightedSum / creditsSum) * 100 + 1e-9) / 100;
  });

  protected readonly hasFailingGrade = computed(() => {
    const gMap = this.grades();
    for (const sub of this.subjects()) {
      const g = gMap[sub.name];
      if (g != null && g < 5) return true;
    }
    return false;
  });

  /**
   * Scholarship rule:
   * Current semester weighted average >= 8.00 and no failing grades (< 5).
   */
  protected readonly isScholarshipEligible = computed(() => {
    const avg = this.weightedAverage();
    return avg !== null && avg >= 8.00 && !this.hasFailingGrade();
  });

  // State for the other semester of the active year
  protected readonly otherSemesterGrades = signal<GradesMap>({});

  protected readonly subjectsS1 = computed<Subject[]>(() => {
    const key = buildCurriculumKey(
      this.studyContext.major(),
      this.studyContext.year(),
      'Semestrul I'
    );
    return CURRICULUM_DATA[key] ?? [];
  });

  protected readonly subjectsS2 = computed<Subject[]>(() => {
    const key = buildCurriculumKey(
      this.studyContext.major(),
      this.studyContext.year(),
      'Semestrul II'
    );
    return CURRICULUM_DATA[key] ?? [];
  });

  protected readonly gradesS1 = computed<GradesMap>(() => {
    return this.studyContext.semester() === 'Semestrul I'
      ? this.grades()
      : this.otherSemesterGrades();
  });

  protected readonly gradesS2 = computed<GradesMap>(() => {
    return this.studyContext.semester() === 'Semestrul II'
      ? this.grades()
      : this.otherSemesterGrades();
  });

  private calculateSemesterAverage(subs: Subject[], gMap: GradesMap): number | null {
    let weightedSum = 0;
    let creditsSum = 0;

    for (const sub of subs) {
      const g = gMap[sub.name];
      if (g != null && Number.isInteger(g) && g >= 1 && g <= 10) {
        weightedSum += g * sub.credits;
        creditsSum += sub.credits;
      }
    }
    if (creditsSum === 0) return null;
    return Math.floor((weightedSum / creditsSum) * 100 + 1e-9) / 100;
  }

  public readonly semester1Average = computed<number | null>(() => {
    return this.calculateSemesterAverage(this.subjectsS1(), this.gradesS1());
  });

  public readonly semester2Average = computed<number | null>(() => {
    return this.calculateSemesterAverage(this.subjectsS2(), this.gradesS2());
  });

  public readonly hasBothSemesters = computed<boolean>(() => {
    return this.semester1Average() !== null && this.semester2Average() !== null;
  });

  public readonly annualAverage = computed<number | null>(() => {
    const avg1 = this.semester1Average();
    const avg2 = this.semester2Average();

    if (avg1 === null || avg2 === null) {
      return null;
    }

    const subs1 = this.subjectsS1();
    const subs2 = this.subjectsS2();
    const g1 = this.gradesS1();
    const g2 = this.gradesS2();

    let totalWeightedPoints = 0;
    let totalCredits = 0;

    for (const s of subs1) {
      const grade = g1[s.name];
      if (grade != null && Number.isInteger(grade) && grade >= 1 && grade <= 10) {
        totalWeightedPoints += grade * s.credits;
        totalCredits += s.credits;
      }
    }

    for (const s of subs2) {
      const grade = g2[s.name];
      if (grade != null && Number.isInteger(grade) && grade >= 1 && grade <= 10) {
        totalWeightedPoints += grade * s.credits;
        totalCredits += s.credits;
      }
    }

    if (totalCredits === 0) return null;

    // Truncate to 2 decimal places without rounding up (e.g. 8.066 -> 8.06)
    return Math.floor((totalWeightedPoints / totalCredits) * 100 + 1e-9) / 100;
  });

  public readonly annualPassedCredits = computed(() => {
    let sum = 0;
    const g1 = this.gradesS1();
    for (const sub of this.subjectsS1()) {
      const g = g1[sub.name];
      if (g != null && g >= 5 && g <= 10) sum += sub.credits;
    }
    const g2 = this.gradesS2();
    for (const sub of this.subjectsS2()) {
      const g = g2[sub.name];
      if (g != null && g >= 5 && g <= 10) sum += sub.credits;
    }
    return sum;
  });

  public readonly annualTotalCredits = computed(() => {
    const s1Total = this.subjectsS1().reduce((s, sub) => s + (sub.credits ?? 0), 0);
    const s2Total = this.subjectsS2().reduce((s, sub) => s + (sub.credits ?? 0), 0);
    return s1Total + s2Total;
  });

  public readonly annualFailedCredits = computed(() => {
    let sum = 0;
    const g1 = this.gradesS1();
    for (const sub of this.subjectsS1()) {
      const g = g1[sub.name];
      if (g != null && g < 5) sum += sub.credits;
    }
    const g2 = this.gradesS2();
    for (const sub of this.subjectsS2()) {
      const g = g2[sub.name];
      if (g != null && g < 5) sum += sub.credits;
    }
    return sum;
  });

  public readonly hasAnnualFailingGrade = computed(() => {
    const g1 = this.gradesS1();
    for (const sub of this.subjectsS1()) {
      const g = g1[sub.name];
      if (g != null && g < 5) return true;
    }
    const g2 = this.gradesS2();
    for (const sub of this.subjectsS2()) {
      const g = g2[sub.name];
      if (g != null && g < 5) return true;
    }
    return false;
  });

  // Save state
  protected readonly hasUnsavedChanges = signal<boolean>(false);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly saveSuccess = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);

  constructor() {
    // Whenever curriculum key or logged in user changes, load saved grades
    effect(() => {
      const key = this.curriculumKey();
      const subs = this.subjects();
      const otherSemester: SemesterRoman =
        this.studyContext.semester() === 'Semestrul I' ? 'Semestrul II' : 'Semestrul I';
      const otherKey = buildCurriculumKey(
        this.studyContext.major(),
        this.studyContext.year(),
        otherSemester
      );
      const otherSubs = CURRICULUM_DATA[otherKey] ?? [];

      // Track auth state to reload cloud grades upon login
      this.authService.user();

      this.gradesService.loadGrades(key, subs).then((loaded) => {
        this.grades.set(loaded);
        this.hasUnsavedChanges.set(false);
        this.saveSuccess.set(null);
        this.saveError.set(null);
      });

      this.gradesService.loadGrades(otherKey, otherSubs).then((otherLoaded) => {
        this.otherSemesterGrades.set(otherLoaded);
      });
    });
  }

  protected setGrade(subjectName: string, value: string): void {
    const trimmed = value.trim();
    const next = { ...this.grades() };
    if (trimmed === '') {
      next[subjectName] = null;
      this.grades.set(next);
      this.gradesService.saveGradesLocally(this.curriculumKey(), next);
      this.hasUnsavedChanges.set(true);
      this.saveSuccess.set(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const clamped = Math.max(1, Math.min(10, n));
    next[subjectName] = clamped;
    this.grades.set(next);
    this.gradesService.saveGradesLocally(this.curriculumKey(), next);
    this.hasUnsavedChanges.set(true);
    this.saveSuccess.set(null);
  }

  protected async saveGradesToCloud(): Promise<void> {
    this.isSaving.set(true);
    this.saveSuccess.set(null);
    this.saveError.set(null);
    try {
      await this.gradesService.saveGradesToCloud(this.curriculumKey(), this.grades());
      this.hasUnsavedChanges.set(false);
      this.saveSuccess.set('Notele au fost salvate cu succes în contul tău!');
      setTimeout(() => {
        this.saveSuccess.set(null);
      }, 4000);
    } catch (err) {
      this.saveError.set('Nu s-au putut salva notele în cloud. Verifică conexiunea.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async resetGrades(): Promise<void> {
    const cleared = await this.gradesService.clearGrades(this.curriculumKey(), this.subjects());
    this.grades.set(cleared);
    this.hasUnsavedChanges.set(false);
    this.saveSuccess.set('Notele semestrului au fost resetate.');
    setTimeout(() => {
      this.saveSuccess.set(null);
    }, 3000);
  }

  protected setSemester(s: SemesterRoman): void {
    this.studyContext.setSemester(s);
  }
}
