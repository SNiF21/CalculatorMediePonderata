import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile';
import { AuthService } from '../services/auth.service';
import { StudyContextService } from '../services/study-context.service';
import { FirebaseService } from '../services/firebase.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([]), AuthService, StudyContextService, FirebaseService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create profile component', () => {
    expect(component).toBeTruthy();
  });

  it('should manage password modal open and close', () => {
    expect(component['showPasswordModal']()).toBe(false);
    component['openPasswordModal']();
    expect(component['showPasswordModal']()).toBe(true);
    component['closePasswordModal']();
    expect(component['showPasswordModal']()).toBe(false);
  });

  it('should manage delete account modal open and close', () => {
    expect(component['showDeleteModal']()).toBe(false);
    component['openDeleteModal']();
    expect(component['showDeleteModal']()).toBe(true);
    component['closeDeleteModal']();
    expect(component['showDeleteModal']()).toBe(false);
  });

  it('should initialize email verification state', () => {
    expect(component['isSendingVerification']()).toBe(false);
    expect(component['verificationSuccess']()).toBeNull();
    expect(component['verificationError']()).toBeNull();
  });

  it('should track profile changes and save them', async () => {
    expect(component['hasProfileChanges']()).toBe(false);
    component['onMajorSelect']('Tehnologia Informației');
    expect(component['hasProfileChanges']()).toBe(true);

    await component['saveProfile']();
    expect(component['hasProfileChanges']()).toBe(false);
  });

  it('should manage faculty and department selections in profile', () => {
    expect(component['selectedFaculty']()).toBe('Facultatea de Inginerie');
    expect(component['selectedDepartment']()).toBe('CIE');
    expect(component['availableDepartments']().length).toBeGreaterThan(0);

    component['onDepartmentSelect']('CIE');
    expect(component['selectedDepartment']()).toBe('CIE');
  });
});
