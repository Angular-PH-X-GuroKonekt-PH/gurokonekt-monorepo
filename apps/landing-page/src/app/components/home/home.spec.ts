import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        provideRouter([]),
        // Home renders Hero (fetches featured mentors) and ContactUs (submits
        // inquiries), both of which need HttpClient.
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
