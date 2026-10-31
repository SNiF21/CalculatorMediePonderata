import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContactComponent } from './contact';
import { AuthService } from '../services/auth.service';
import { StudyContextService } from '../services/study-context.service';
import { ContactService } from '../services/contact.service';
import { FirebaseService } from '../services/firebase.service';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;
  let contactService: ContactService;

  beforeEach(async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        AuthService,
        StudyContextService,
        ContactService,
        FirebaseService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    contactService = TestBed.inject(ContactService);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create contact component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default category credite and context values', () => {
    expect(component.category()).toBe('credite');
    expect(component.categories.length).toBe(4);
    expect(component.faculty()).toContain('Inginerie');
  });

  it('should switch category on selectCategory', () => {
    component.selectCategory('tehnic');
    expect(component.category()).toBe('tehnic');

    component.selectCategory('sugestie');
    expect(component.category()).toBe('sugestie');
  });

  it('should handle validation error on empty submit', async () => {
    component.email.set('');
    component.subjectTitle.set('');
    component.message.set('');

    await component.onSubmit();
    expect(component.submitError()).toBeTruthy();
    expect(component.submitSuccess()).toBeNull();
  });

  it('should successfully submit valid form and display success banner', async () => {
    component.email.set('student.test@ulbsibiu.ro');
    component.subjectTitle.set('Eroare numar credite');
    component.message.set('Materia X ar trebui sa aiba 5 credite.');

    await component.onSubmit();
    expect(component.submitSuccess()).toBeTruthy();
    expect(component.ticketId()).toContain('TIC-');
    expect(component.submitError()).toBeNull();

    component.resetForm();
    expect(component.submitSuccess()).toBeNull();
    expect(component.ticketId()).toBeNull();
    expect(component.subjectTitle()).toBe('');
    expect(component.formSubmitted()).toBe(false);

    // Should immediately allow submitting a 2nd ticket without any cooldown/restriction
    component.subjectTitle.set('A doua sesizare');
    component.message.set('Descriere detaliata pentru a doua sesizare.');
    await component.onSubmit();
    expect(component.submitSuccess()).toBeTruthy();
    expect(component.ticketId()).toContain('TIC-');
  });

  it('should validate form fields accurately', () => {
    component.email.set('invalid-email');
    expect(component.isEmailValid()).toBe(false);

    component.email.set('test@ulbsibiu.ro');
    expect(component.isEmailValid()).toBe(true);

    component.subjectTitle.set('ab');
    expect(component.isSubjectValid()).toBe(false);

    component.subjectTitle.set('abc');
    expect(component.isSubjectValid()).toBe(true);

    component.message.set('123456789');
    expect(component.isMessageValid()).toBe(false);

    component.message.set('1234567890');
    expect(component.isMessageValid()).toBe(true);
  });
});

