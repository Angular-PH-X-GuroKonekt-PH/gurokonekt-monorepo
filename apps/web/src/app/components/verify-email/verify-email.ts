import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { IconComponent } from '../shared/icon/icon.component';
import { RouterNavigationHelper } from '../../helpers/router-navigation.helper';
import { VerifyEmailState } from '../../store/verify-email/verify-email.state';
import * as VerifyEmailActions from '../../store/verify-email/verify-email.actions';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [IconComponent, AsyncPipe],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  // Select state using decorators (returns Observable)
  @Select(VerifyEmailState.email) email$!: Observable<string>;
  @Select(VerifyEmailState.role) role$!: Observable<string>;
  @Select(VerifyEmailState.message) message$!: Observable<string>;
  @Select(VerifyEmailState.isResendLoading) isResendLoading$!: Observable<boolean>;
  @Select(VerifyEmailState.resendError) resendError$!: Observable<string | null>;

  ngOnInit(): void {
    // No subscription needed! Just dispatch action
    const params = this.route.snapshot.queryParams;
    this.store.dispatch(new VerifyEmailActions.InitializeVerification({
      email: params['email'] || '',
      role: params['role'] || '',
      message: params['message'] || ''
    }));
  }

  protected resendVerificationEmail(): void {
    // Just dispatch action, state handles the rest
    this.store.dispatch(new VerifyEmailActions.ResendVerificationEmail());
  }

  protected getDefaultMessage(): string {
    return 'Thank you for joining GuroKonekt! We have sent you an email to verify your account. Please check your inbox and click the verification link to activate your account.';
  }

  protected navigateToLogin(): void {
    RouterNavigationHelper.navigateToLogin(this.router);
  }
}