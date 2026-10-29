import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculatorResultsComponent } from './calculator-results';

describe('CalculatorResultsComponent', () => {
  let component: CalculatorResultsComponent;
  let fixture: ComponentFixture<CalculatorResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorResultsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create calculator results component', () => {
    expect(component).toBeTruthy();
  });

  it('should receive inputs with default values', () => {
    expect(component.weightedAverage()).toBeNull();
    expect(component.isScholarshipEligible()).toBe(false);
    expect(component.allSubjectsPassed()).toBe(false);
    expect(component.passedCredits()).toBe(0);
    expect(component.totalCredits()).toBe(0);
    expect(component.failedCredits()).toBe(0);
  });
});

