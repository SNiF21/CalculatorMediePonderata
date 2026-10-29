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
});

