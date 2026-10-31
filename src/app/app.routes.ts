import { Routes } from '@angular/router';

import { ProfileComponent } from './profile/profile';
import { Calculator } from './calculator/calculator';
import { AuthComponent } from './auth/auth';
import { ContactComponent } from './contact/contact';
import { emailVerifiedGuard } from './guards/email-verified.guard';

export const routes: Routes = [
	{ path: '', component: ProfileComponent },
	{ path: 'profile', redirectTo: '', pathMatch: 'full' },
	{ path: 'calculator', component: Calculator, canActivate: [emailVerifiedGuard] },
	{ path: 'contact', component: ContactComponent },
	{ path: 'login', component: AuthComponent },
	{ path: 'auth', redirectTo: 'login', pathMatch: 'full' },
];
