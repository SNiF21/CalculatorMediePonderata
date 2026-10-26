import { Routes } from '@angular/router';

import { ProfileComponent } from './profile/profile';
import { Calculator } from './calculator/calculator';
import { AuthComponent } from './auth/auth';

export const routes: Routes = [
	{ path: '', component: ProfileComponent },
	{ path: 'profile', redirectTo: '', pathMatch: 'full' },
	{ path: 'calculator', component: Calculator },
	{ path: 'login', component: AuthComponent },
	{ path: 'auth', redirectTo: 'login', pathMatch: 'full' },
];
