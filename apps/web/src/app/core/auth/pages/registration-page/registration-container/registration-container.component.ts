import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { RegistrationRoleSelectionPage } from '../registration-role-selection-page/registration-role-selection.page';
import * as RegistrationActions from '../../../store/registration.actions';
import * as AuthActions from '../../../store/auth.actions';
import { RegistrationMenteePage } from '../registration-mentee-page/registration-mentee.page';
import { RegistrationMentorPage } from '../registration-mentor-page/registration-mentor.page';
import { RegistrationSelectors } from '../../../store/registration.selectors';

@Component({
	selector: 'app-registration-container',
	standalone: true,
	imports: [RegistrationRoleSelectionPage, RegistrationMenteePage, RegistrationMentorPage],
	templateUrl: './registration-container.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationContainer implements OnInit {
	private readonly store = inject(Store);
	private readonly route = inject(ActivatedRoute);

	protected readonly currentStep = this.store.selectSignal(
		RegistrationSelectors.currentStep
	);

	ngOnInit() {
		// Clear any stale auth messages from previous login attempts
		this.store.dispatch(new AuthActions.ClearAuthMessages());

		// Initialize from query params once using snapshot (no subscription)
		const step = this.route.snapshot.queryParams['step'];
		this.store.dispatch(new RegistrationActions.InitializeFromQueryParams(step));
	}

	onRoleSelected(role: 'mentee' | 'mentor') {
		this.store.dispatch(new RegistrationActions.RoleSelected(role));
	}

	onBackToRoleSelection() {
		this.store.dispatch(new RegistrationActions.BackToRoleSelection());
	}
}
