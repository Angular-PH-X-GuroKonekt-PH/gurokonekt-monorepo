import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthSelectors } from '../../core/auth/store/auth.selectors';

export const menteeCanMatch: CanMatchFn = (): boolean =>
  inject(Store).selectSnapshot(AuthSelectors.user)?.role === 'mentee';
