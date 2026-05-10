import { TestBed } from '@angular/core/testing';
import { AuthStorageService } from './auth-storage.service';
import { AuthUser } from '@gurokonekt/models';

const mockUser: AuthUser = {
  id: 'u1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'mentee',
  isProfileComplete: false,
  isMentorProfileComplete: false,
};

describe('AuthStorageService', () => {
  let service: AuthStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStorageService);
  });

  afterEach(() => localStorage.clear());

  it('round-trips a token', () => {
    service.setToken('tok123');
    expect(service.getToken()).toBe('tok123');
  });

  it('returns null when no token is stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('round-trips a user object', () => {
    service.setUser(mockUser);
    expect(service.getUser()).toEqual(mockUser);
  });

  it('returns null when no user is stored', () => {
    expect(service.getUser()).toBeNull();
  });

  it('returns null when stored user JSON is corrupt', () => {
    localStorage.setItem('auth_user', '{not-valid-json');
    expect(service.getUser()).toBeNull();
  });

  it('clear() removes both token and user', () => {
    service.setToken('tok');
    service.setUser(mockUser);
    service.clear();
    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });
});
