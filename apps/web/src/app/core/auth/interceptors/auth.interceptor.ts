import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStorageService } from '../../storage/auth-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStorageService).getToken();

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
