import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { vi } from 'vitest';
import { App } from './app';
import * as AuthActions from './core/auth/store/auth.actions';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NgxsModule.forRoot([])],
      providers: [
        provideRouter([]),
        { provide: Store, useValue: { dispatch: vi.fn().mockReturnValue({ subscribe: vi.fn() }) } },
      ],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
