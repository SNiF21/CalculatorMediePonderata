import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const emailVerifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If student is logged in but hasn't verified their email, block access and redirect to root
  if (authService.isLoggedIn() && !authService.isEmailVerified()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
