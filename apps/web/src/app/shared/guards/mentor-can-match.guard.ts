import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../../core/auth/store/auth.state';

export const mentorCanMatch: CanMatchFn = (): boolean =>
  inject(Store).selectSnapshot(AuthState.user)?.role === 'mentor';
