import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CURRICULUM_DATA } from '../data/curriculumData';
import { Subject } from '../models/studyProfile';

type GradesMap = Record<string, number | null>;

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.html',
  styleUrls: ['./calculator.css'],
})
export class Calculator {
  // Hardcoded test profile for offline Stage 3
  protected readonly profileKey = 'Calculatoare - Anul 4, Semestrul 2';

  protected readonly subjects = signal<Subject[]>(
    CURRICULUM_DATA[this.profileKey] ?? []
  );

  protected readonly grades = signal<GradesMap>({});

  protected readonly totalCredits = computed(() =>
    this.subjects().reduce((s, sub) => s + (sub.credits ?? 0), 0)
  );

  protected readonly weightedAverage = computed(() => {
    const subs = this.subjects();
    let weightedSum = 0;
    let creditsSum = 0;
    for (const sub of subs) {
      const g = this.grades()[sub.name];
      if (g != null && Number.isInteger(g) && g >= 1 && g <= 10) {
        weightedSum += g * sub.credits;
        creditsSum += sub.credits;
      }
    }
    if (creditsSum === 0) return null;
    return Math.round((weightedSum / creditsSum) * 100) / 100;
  });

  constructor() {
    // initialize grades map
    const initial: GradesMap = {};
    for (const s of this.subjects()) initial[s.name] = null;
    this.grades.set(initial);

    // load saved from localStorage if present
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey());
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as GradesMap;
          // Only set keys that exist
          const merged: GradesMap = { ...this.grades() };
          for (const k of Object.keys(parsed)) {
            if (k in merged) merged[k] = parsed[k];
          }
          this.grades.set(merged);
        } catch {
          // ignore parse errors
        }
      }
    }

    // persist changes to localStorage
    effect(() => {
      const snapshot = this.grades();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey(), JSON.stringify(snapshot));
      }
    });
  }

  protected storageKey() {
    return `grades:${this.profileKey}`;
  }

  protected setGrade(subjectName: string, value: string) {
    const trimmed = value.trim();
    const next = { ...this.grades() };
    if (trimmed === '') {
      next[subjectName] = null;
      this.grades.set(next);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const clamped = Math.max(1, Math.min(10, n));
    next[subjectName] = clamped;
    this.grades.set(next);
  }

  protected resetGrades() {
    const cleared: GradesMap = {};
    for (const s of this.subjects()) cleared[s.name] = null;
    this.grades.set(cleared);
  }

  protected saveLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.grades()));
    }
  }
}
