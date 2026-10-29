import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator-results.html',
})
export class CalculatorResultsComponent {
  public readonly weightedAverage = input<number | null>(null);
  public readonly isScholarshipEligible = input<boolean>(false);
  public readonly allSubjectsPassed = input<boolean>(false);
  public readonly hasFailingGrade = input<boolean>(false);
  public readonly passedCredits = input<number>(0);
  public readonly totalCredits = input<number>(0);
  public readonly failedCredits = input<number>(0);
  public readonly semesterLabel = input<string>('1');
}

