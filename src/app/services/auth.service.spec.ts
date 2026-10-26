import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, FirebaseService],
    });
    service = TestBed.inject(AuthService);
  });

  describe('Institutional Email Validation (@ulbsibiu.ro)', () => {
    it('should accept valid @ulbsibiu.ro emails', () => {
      expect(service.isValidInstitutionalEmail('andrei.popescu@ulbsibiu.ro')).toBe(true);
      expect(service.isValidInstitutionalEmail('student123@ulbsibiu.ro')).toBe(true);
      expect(service.isValidInstitutionalEmail('prenume.nume@ULBSIBIU.RO')).toBe(true);
    });

    it('should reject non-institutional email domains', () => {
      expect(service.isValidInstitutionalEmail('test@gmail.com')).toBe(false);
      expect(service.isValidInstitutionalEmail('user@yahoo.com')).toBe(false);
      expect(service.isValidInstitutionalEmail('user@ulbsibiu.com')).toBe(false);
      expect(service.isValidInstitutionalEmail('user@sub.ulbsibiu.ro')).toBe(false);
    });

    it('should reject invalid or empty email formats', () => {
      expect(service.isValidInstitutionalEmail('')).toBe(false);
      expect(service.isValidInstitutionalEmail('   ')).toBe(false);
      expect(service.isValidInstitutionalEmail('@ulbsibiu.ro')).toBe(false);
      expect(service.isValidInstitutionalEmail('ulbsibiu.ro')).toBe(false);
    });

    it('should throw an error when registering with a non-institutional email', async () => {
      await expect(service.register('attacker@gmail.com', 'password123')).rejects.toThrow(
        'Înregistrarea este permisă doar cu adresa instituțională (@ulbsibiu.ro).'
      );
    });

    it('should report isEmailVerified as false when logged out', () => {
      expect(service.isEmailVerified()).toBe(false);
    });

    it('should update isEmailVerified when reloadUser is called', async () => {
      const mockUser = {
        email: 'student@ulbsibiu.ro',
        emailVerified: false,
        reload: vi.fn().mockImplementation(async function(this: any) {
          this.emailVerified = true;
        }),
        getIdToken: vi.fn().mockResolvedValue('token'),
      } as any;
      (service as any).firebase.auth = { currentUser: mockUser };
      service.user.set(mockUser);

      await service.reloadUser();

      expect(mockUser.reload).toHaveBeenCalled();
      expect(service.isEmailVerified()).toBe(true);
    });
  });
});
