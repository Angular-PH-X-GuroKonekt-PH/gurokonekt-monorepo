import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';
import { provideRouter } from '@angular/router';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
