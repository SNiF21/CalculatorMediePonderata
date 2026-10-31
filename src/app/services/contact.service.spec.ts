import { TestBed } from '@angular/core/testing';
import { ContactService, ContactSubmission } from './contact.service';
import { FirebaseService } from './firebase.service';

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);

    TestBed.configureTestingModule({
      providers: [ContactService, FirebaseService],
    });
    service = TestBed.inject(ContactService);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_contact_submissions');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_contact_submissions');
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reject invalid email', async () => {
    const invalid: ContactSubmission = {
      email: 'invalid-email',
      category: 'credite',
      subjectTitle: 'Titlu valid',
      message: 'Descriere problema cu creditele ECTS',
    };

    await expect(service.submitMessage(invalid)).rejects.toThrow(
      'Te rugăm să introduci o adresă de email validă.'
    );
  });

  it('should reject short subject title', async () => {
    const invalid: ContactSubmission = {
      email: 'student@ulbsibiu.ro',
      category: 'credite',
      subjectTitle: 'ab',
      message: 'Descriere problema cu creditele ECTS',
    };

    await expect(service.submitMessage(invalid)).rejects.toThrow(
      'Subiectul trebuie să aibă cel puțin 3 caractere.'
    );
  });

  it('should reject short message', async () => {
    const invalid: ContactSubmission = {
      email: 'student@ulbsibiu.ro',
      category: 'credite',
      subjectTitle: 'Titlu valid',
      message: 'Scurt',
    };

    await expect(service.submitMessage(invalid)).rejects.toThrow(
      'Descrierea problemei trebuie să conțină cel puțin 10 caractere.'
    );
  });

  it('should successfully submit valid message and persist to local storage', async () => {
    const valid: ContactSubmission = {
      name: 'Ion Popescu',
      email: 'ion.popescu@ulbsibiu.ro',
      category: 'credite',
      faculty: 'Facultatea de Inginerie',
      major: 'Calculatoare',
      year: 'Anul III',
      subjectTitle: 'Materia Sisteme de Operare are 5 credite',
      message: 'Conform planului de învățământ aprobat, materia are 5 credite în loc de 4.',
    };

    const res = await service.submitMessage(valid);
    expect(res.success).toBe(true);
    expect(res.ticketId).toContain('TIC-');

    const stored = service.getLocalSubmissions();
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe(res.ticketId);
    expect(stored[0].email).toBe('ion.popescu@ulbsibiu.ro');
    expect(stored[0].subjectTitle).toBe('Materia Sisteme de Operare are 5 credite');
  });
});
