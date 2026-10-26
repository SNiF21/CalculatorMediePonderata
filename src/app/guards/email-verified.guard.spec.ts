import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { emailVerifiedGuard } from './email-verified.guard';
import { AuthService } from '../services/auth.service';
import { FirebaseService } from '../services/firebase.service';
import { type User } from 'firebase/auth';

describe('emailVerifiedGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        FirebaseService,
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should allow access when logged out', () => {
    authService.user.set(null);
    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should allow access when user email is verified', () => {
    authService.user.set({ email: 'student@ulbsibiu.ro', emailVerified: true } as User);
    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should block access and redirect to / when user is logged in with unverified email', () => {
    authService.user.set({ email: 'student@ulbsibiu.ro', emailVerified: false } as User);
    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard({} as any, {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
