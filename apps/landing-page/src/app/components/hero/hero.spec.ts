import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Hero } from './hero';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';
import { provideRouter } from '@angular/router';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
