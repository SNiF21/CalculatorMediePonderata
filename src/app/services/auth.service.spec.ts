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
  });
});
