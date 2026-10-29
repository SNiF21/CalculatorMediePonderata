import { Component, input, output } from '@angular/core';
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

  public readonly switchSemester = output<SemesterRoman>();

  protected onSwitchSemester(sem: SemesterRoman): void {
    this.switchSemester.emit(sem);
  }
}

