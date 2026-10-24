import { Routes } from '@angular/router';

import { LandingPage } from './landingPage';
import { Calculator } from './calculator/calculator';
import { AuthComponent } from './auth/auth';

export const routes: Routes = [
	{ path: '', component: LandingPage },
	{ path: 'calculator', component: Calculator },
	{ path: 'login', component: AuthComponent },
	{ path: 'auth', redirectTo: 'login', pathMatch: 'full' },
];

