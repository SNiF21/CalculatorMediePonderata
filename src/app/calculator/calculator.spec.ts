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

  it('should truncate the weighted average to 2 decimal places without rounding up (e.g. 8.066 -> 8.06)', () => {
    studyContext.setProfile('Calculatoare', 'II', 'Semestrul I');
    const grades: Record<string, string> = {
      'Analiza algoritmilor': '8',
      'Structuri de date și algoritmi': '7',
      'Dispozitive electronice și electronică analogică': '7',
      'Programare în limbaj de asamblare': '7',
      'Teoria probabilităților și statistică matematică': '9',
      'Teoria sistemelor': '10',
      'Programare orientată pe obiecte II': '9',
      'Limbă străină 3': '8',
    };
    for (const [sub, g] of Object.entries(grades)) {
      component['setGrade'](sub, g);
    }
    // 242 / 30 = 8.0666... Truncated to 2 decimals gives 8.06
    expect(component['weightedAverage']()).toBe(8.06);
  });

  it('should require selecting an optional course before grading and prevent duplicates in shared optionals pool', async () => {
    studyContext.setProfile('Calculatoare', 'IV', 'Semestrul I');
    fixture.detectChanges();
    await fixture.whenStable();

    const opt7 = component.subjects().find((s) => s.name === 'Opțional 7');
    const opt8 = component.subjects().find((s) => s.name === 'Opțional 8');
    expect(opt7).toBeDefined();
    expect(opt8).toBeDefined();
    expect(component.isOptional(opt7!)).toBe(true);
    expect(component.isOptional(opt8!)).toBe(true);

    // 1. Grade input is initially disabled for optional subject
    expect(component.isGradeDisabled(opt7!)).toBe(true);
    component['setGrade'](opt7!.name, '9');
    expect(component['grades']()[opt7!.name]).toBeNull();

    // 2. Both optionals have full list of 5 options
    expect(component.getAvailableOptions(opt7!).length).toBe(5);
    expect(component.getAvailableOptions(opt8!).length).toBe(5);

    // 3. User selects "Învățare automată" for Opțional 7
    component.setOptionalCourse(opt7!.name, 'Învățare automată');
    expect(component.isGradeDisabled(opt7!)).toBe(false);

    // Now grade can be entered
    component['setGrade'](opt7!.name, '9');
    expect(component['grades']()[opt7!.name]).toBe(9);

    // 4. "Învățare automată" should be excluded from Opțional 8 available options
    const opt8Available = component.getAvailableOptions(opt8!);
    expect(opt8Available.length).toBe(4);
    expect(opt8Available).not.toContain('Învățare automată');

    // Opțional 7 still contains its chosen option
    expect(component.getAvailableOptions(opt7!)).toContain('Învățare automată');

    // 5. If Opțional 7 is changed to "E-Commerce", "Învățare automată" returns to Opțional 8
    component.setOptionalCourse(opt7!.name, 'E-Commerce');
    expect(component.getAvailableOptions(opt8!)).toContain('Învățare automată');
    expect(component.getAvailableOptions(opt8!)).not.toContain('E-Commerce');
  });

  it('should calculate annual average only when both semesters have grades', () => {
    studyContext.setProfile('Calculatoare', 'I', 'Semestrul I');
    expect(component.annualAverage()).toBeNull();
    expect(component.hasBothSemesters()).toBe(false);

    // Enter grade in Semester 1
    const subsS1 = component.subjects();
    component['setGrade'](subsS1[0].name, '8');

    // S2 has no grades yet -> annualAverage must still be null
    expect(component.annualAverage()).toBeNull();
    expect(component.hasBothSemesters()).toBe(false);

    // Provide a grade for S2 in otherSemesterGrades
    const subsS2 = component['subjectsS2']();
    const otherMap: Record<string, number | null> = {};
    for (const s of subsS2) {
      otherMap[s.name] = null;
    }
    otherMap[subsS2[0].name] = 10;
    component['otherSemesterGrades'].set(otherMap);

    // Now both semesters have grades
    expect(component.hasBothSemesters()).toBe(true);
    expect(component.annualAverage()).not.toBeNull();
  });

  it('should support sorting subjects by default, alfabetic, crescator, descrescator and return evaluation badges', async () => {
    studyContext.setProfile('Calculatoare', 'I', 'Semestrul I');
    fixture.detectChanges();
    await fixture.whenStable();

    // Default sorting preserves curriculum order
    expect(component.sortOrder()).toBe('default');
    const defaultSubs = component.orderedSubjects();
    expect(defaultSubs.length).toBe(8);

    // Alfabetic sorting
    component.setSortOrder('alfabetic');
    const alfabeticSubs = component.orderedSubjects();
    const sortedNames = [...defaultSubs.map((s) => s.name)].sort((a, b) =>
      a.localeCompare(b, 'ro', { sensitivity: 'base' })
    );
    expect(alfabeticSubs.map((s) => s.name)).toEqual(sortedNames);

    // Set grades to test crescator / descrescator
    component['setGrade'](alfabeticSubs[0].name, '6');
    component['setGrade'](alfabeticSubs[1].name, '10');
    component['setGrade'](alfabeticSubs[2].name, '8');

    // Crescator: graded lowest to highest first
    component.setSortOrder('crescator');
    const crescatorSubs = component.orderedSubjects();
    expect(component['grades']()[crescatorSubs[0].name]).toBe(6);
    expect(component['grades']()[crescatorSubs[1].name]).toBe(8);
    expect(component['grades']()[crescatorSubs[2].name]).toBe(10);

    // Descrescator: graded highest to lowest first
    component.setSortOrder('descrescator');
    const descSubs = component.orderedSubjects();
    expect(component['grades']()[descSubs[0].name]).toBe(10);
    expect(component['grades']()[descSubs[1].name]).toBe(8);
    expect(component['grades']()[descSubs[2].name]).toBe(6);

    // Evaluation badge styling remains functional
    const examBadge = component.getEvaluationBadge('Examen');
    expect(examBadge.label).toBe('Examen');

    const colBadge = component.getEvaluationBadge('Colocviu');
    expect(colBadge.label).toBe('Colocviu');

    const projBadge = component.getEvaluationBadge('Verificare (Proiect)');
    expect(projBadge.label).toBe('Verificare (Proiect)');
  });
});
