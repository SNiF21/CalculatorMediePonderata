import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordModalComponent } from './change-password-modal';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';

describe('ChangePasswordModalComponent', () => {
  let component: ChangePasswordModalComponent;
  let fixture: ComponentFixture<ChangePasswordModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordModalComponent],
      providers: [AuthService, FirebaseService],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeModal when close is called', () => {
    let closed = false;
    component.closeModal.subscribe(() => {
      closed = true;
    });

    component['close']();
    expect(closed).toBe(true);
  });
});

