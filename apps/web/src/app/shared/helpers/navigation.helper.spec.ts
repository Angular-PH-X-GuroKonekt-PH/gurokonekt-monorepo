import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { NavigationHelper } from './navigation.helper';
import { APP_ROUTES } from '../constants/routes';

describe('NavigationHelper', () => {
  let helper: NavigationHelper;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        NavigationHelper,
        { provide: Router, useValue: { navigate } },
      ],
    });
    helper = TestBed.inject(NavigationHelper);
  });

  it('navigateToLogin() calls router with LOGIN route', async () => {
    await helper.navigateToLogin();
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.LOGIN]);
  });

  it('navigateToRoleSelection() calls router with REGISTER route', async () => {
    await helper.navigateToRoleSelection();
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.REGISTER]);
  });

  it('navigateToDashboard() sends complete mentee to DASHBOARD', async () => {
    await helper.navigateToDashboard('mentee', true, false);
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.DASHBOARD]);
  });

  it('navigateToDashboard() sends complete mentor to DASHBOARD', async () => {
    await helper.navigateToDashboard('mentor', false, true);
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.DASHBOARD]);
  });

  it('navigateToDashboard() sends incomplete mentee to PROFILE_SETUP', async () => {
    await helper.navigateToDashboard('mentee', false, false);
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.PROFILE_SETUP]);
  });

  it('navigateToDashboard() sends incomplete mentor to PROFILE_SETUP', async () => {
    await helper.navigateToDashboard('mentor', false, false);
    expect(navigate).toHaveBeenCalledWith([APP_ROUTES.PROFILE_SETUP]);
  });
});
