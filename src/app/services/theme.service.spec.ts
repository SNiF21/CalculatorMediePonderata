import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle theme between light and dark', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);

    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);

    service.toggleTheme();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('should allow setting system theme', () => {
    service.setTheme('system');
    expect(service.theme()).toBe('system');
  });
});
