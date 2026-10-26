import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { StudyContextService } from './services/study-context.service';
import { SemesterRoman } from './models/studyProfile';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './appShell.html',
  styleUrls: ['./appShell.css'],
})
export class AppShell {
  protected readonly authService = inject(AuthService);
  protected readonly studyContext = inject(StudyContextService);
  protected readonly title = signal('Calculator Medie Ponderată — Inginerie');

  protected setSemester(sem: SemesterRoman) {
    this.studyContext.setSemester(sem);
  }

  protected async logout() {
    await this.authService.logout();
  }
}
