import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignCarPage } from './sign-car.page';

describe('SignCarPage', () => {
  let component: SignCarPage;
  let fixture: ComponentFixture<SignCarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SignCarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
