import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Calculator } from './calculator';
import { StudyContextService } from '../services/study-context.service';
import { AuthService } from '../services/auth.service';
import { FirebaseService } from '../services/firebase.service';
import { GradesService } from '../services/grades.service';

describe('Calculator', () => {
  let component: Calculator;
  let fixture: ComponentFixture<Calculator>;
  let studyContext: StudyContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calculator],
      providers: [
        provideRouter([]),
        StudyContextService,
        AuthService,
        FirebaseService,
        GradesService,
      ],
    }).compileComponents();

    studyContext = TestBed.inject(StudyContextService);
    fixture = TestBed.createComponent(Calculator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subjects for active study profile and semester', () => {
    expect(component.subjects().length).toBeGreaterThan(0);
    expect(component.curriculumKey()).toContain('Calculatoare - Anul 1, Semestrul 1');
  });

  it('should update subjects and curriculum key when switching semester', async () => {
    studyContext.setSemester('Semestrul II');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.curriculumKey()).toContain('Semestrul 2');
    expect(component.subjects().length).toBeGreaterThan(0);
  });

  it('should verify scholarship eligibility for semester average >= 8.00 without fails', () => {
    // Before grades, not eligible
    expect(component['isScholarshipEligible']()).toBe(false);

    // Set high grades
    const subs = component.subjects();
    for (const s of subs) {
      component['setGrade'](s.name, '9');
    }

    expect(component['weightedAverage']()).toBe(9);
    expect(component['hasFailingGrade']()).toBe(false);
    expect(component['isScholarshipEligible']()).toBe(true);

    // If one grade is a fail (< 5)
    component['setGrade'](subs[0].name, '4');
    expect(component['hasFailingGrade']()).toBe(true);
    expect(component['isScholarshipEligible']()).toBe(false);
  });

  it('should not add failed exam credits to the total passed credits (e.g. 2-credit fail leaves 28/30)', () => {
    const subs = component.subjects();
    const totalCredits = component['totalCredits'](); // 30

    // Pass all subjects with grade 10
    for (const s of subs) {
      component['setGrade'](s.name, '10');
    }
    expect(component.passedCredits()).toBe(totalCredits);
    expect(component.failedCredits()).toBe(0);

    // Fail the 2-credit subject (Limba Straina 1 has 2 credits)
    const twoCreditSub = subs.find((s) => s.credits === 2) ?? subs[0];
    component['setGrade'](twoCreditSub.name, '4');

    expect(component.failedCredits()).toBe(twoCreditSub.credits);
    expect(component.passedCredits()).toBe(totalCredits - twoCreditSub.credits);
    // If total was 30 and 2 credits failed, passedCredits is 28, NOT 30!
    expect(component.passedCredits()).toBe(30 - twoCreditSub.credits);
  });

  it('should track unsaved changes when grade is changed and clear after saving', async () => {
    const subs = component.subjects();
    expect(component['hasUnsavedChanges']()).toBe(false);

    component['setGrade'](subs[0].name, '8');
    expect(component['hasUnsavedChanges']()).toBe(true);

    await component['saveGradesToCloud']();
    expect(component['hasUnsavedChanges']()).toBe(false);
  });
});
