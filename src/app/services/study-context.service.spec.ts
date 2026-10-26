import { TestBed } from '@angular/core/testing';
import { StudyContextService } from './study-context.service';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

describe('StudyContextService', () => {
  let service: StudyContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudyContextService, AuthService, FirebaseService],
    });
    service = TestBed.inject(StudyContextService);
  });

  it('should initialize with default major, year, and semester', () => {
    expect(service.majors).toContain('Calculatoare');
    expect(service.majors).toContain('Tehnologia Informației');
    expect(service.majors).toContain('Ingineria Sistemelor Multimedia');
    expect(service.years.length).toBe(4);
    expect(service.semesters.length).toBe(2);
  });

  it('should switch semester globally and update curriculumKey', () => {
    service.setSemester('Semestrul II');
    expect(service.semester()).toBe('Semestrul II');
    expect(service.curriculumKey()).toContain('Semestrul 2');

    service.setSemester('Semestrul I');
    expect(service.semester()).toBe('Semestrul I');
    expect(service.curriculumKey()).toContain('Semestrul 1');
  });

  it('should switch major and year and update subjects', () => {
    service.setMajor('Tehnologia Informației');
    service.setYear('II');
    service.setSemester('Semestrul I');

    expect(service.curriculumKey()).toBe('Tehnologia Informației - Anul 2, Semestrul 1');
    expect(service.subjects().length).toBeGreaterThan(0);
  });
});
