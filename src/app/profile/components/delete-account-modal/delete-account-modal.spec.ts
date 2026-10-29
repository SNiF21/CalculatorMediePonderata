import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeleteAccountModalComponent } from './delete-account-modal';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';

describe('DeleteAccountModalComponent', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountModalComponent],
      providers: [provideRouter([]), AuthService, FirebaseService],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccountModalComponent);
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

