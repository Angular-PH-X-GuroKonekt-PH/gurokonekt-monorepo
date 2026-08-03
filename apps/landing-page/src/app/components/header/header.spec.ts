import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
