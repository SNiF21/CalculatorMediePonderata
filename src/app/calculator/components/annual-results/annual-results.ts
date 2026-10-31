import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SemesterRoman } from '../../../models/studyProfile';

@Component({
  selector: 'app-annual-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annual-results.html',
})
export class AnnualResultsComponent {
  public readonly annualAverage = input<number | null>(null);
  public readonly semester1Average = input<number | null>(null);
  public readonly semester2Average = input<number | null>(null);
  public readonly annualPassedCredits = input<number>(0);
  public readonly annualTotalCredits = input<number>(60);
  public readonly annualFailedCredits = input<number>(0);
  public readonly hasAnnualFailingGrade = input<boolean>(false);
  public readonly yearLabel = input<string>('Anul I');
  public readonly hasBothSemesters = input<boolean>(false);
  public readonly activeSemester = input<SemesterRoman>('Semestrul I');

  public readonly switchSemester = output<SemesterRoman>();

  /**
   * Only show pending notice when viewing the semester that already HAS grades,
   * prompting to switch to the other semester.
   * Once the student switches to the missing semester, hide the notice.
   */
  public readonly showPendingNotice = computed<boolean>(() => {
    if (this.hasBothSemesters()) {
      return false;
    }
    const current = this.activeSemester();
    if (current === 'Semestrul I') {
      return this.semester1Average() !== null && this.semester2Average() === null;
    } else {
      return this.semester2Average() !== null && this.semester1Average() === null;
    }
  });

  protected onSwitchSemester(sem: SemesterRoman): void {
    this.switchSemester.emit(sem);
  }
}

