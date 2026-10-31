import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnualResultsComponent } from './annual-results';

describe('AnnualResultsComponent', () => {
  let component: AnnualResultsComponent;
  let fixture: ComponentFixture<AnnualResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnualResultsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create annual results component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit switchSemester when onSwitchSemester is called', () => {
    let switchedSem: string | null = null;
    component.switchSemester.subscribe((sem) => {
      switchedSem = sem;
    });

    component['onSwitchSemester']('Semestrul II');
    expect(switchedSem).toBe('Semestrul II');
  });

  it('should only show pending notice when viewing semester with grades while other semester is empty', () => {
    // Default state: no grades, hasBothSemesters = false, activeSemester = 'Semestrul I'
    expect(component.showPendingNotice()).toBe(false);

    // Semestrul 1 has average 8.22, Semestrul 2 has null
    fixture.componentRef.setInput('semester1Average', 8.22);
    fixture.componentRef.setInput('semester2Average', null);
    fixture.componentRef.setInput('hasBothSemesters', false);
    fixture.componentRef.setInput('activeSemester', 'Semestrul I');
    fixture.detectChanges();

    // When on Semestrul I, notice should appear
    expect(component.showPendingNotice()).toBe(true);

    // When switched to Semestrul II, notice should NOT appear
    fixture.componentRef.setInput('activeSemester', 'Semestrul II');
    fixture.detectChanges();
    expect(component.showPendingNotice()).toBe(false);

    // When both semesters have grades, notice should NOT appear
    fixture.componentRef.setInput('semester2Average', 9.0);
    fixture.componentRef.setInput('hasBothSemesters', true);
    fixture.detectChanges();
    expect(component.showPendingNotice()).toBe(false);
  });
});

