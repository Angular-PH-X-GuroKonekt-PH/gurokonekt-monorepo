import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { RegistrationRoleSelectionPage } from '../registration-role-selection-page/registration-role-selection.page';
import { RegistrationStep } from '../../../models/registration.state.model';
import { RegistrationState } from '../../../store/registration.state';
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
})
export class RegistrationContainer implements OnInit {
	private store = inject(Store);
	private route = inject(ActivatedRoute);

	protected currentStep = signal<RegistrationStep>('choose-role');

	ngOnInit() {
		// Clear any stale auth messages from previous login attempts
		this.store.dispatch(new AuthActions.ClearAuthMessages());
		
		// Initialize from query params once using snapshot (no subscription)
		const step = this.route.snapshot.queryParams['step'];
		this.store.dispatch(new RegistrationActions.InitializeFromQueryParams(step));
		
		// Get initial state and update signal
		const initialStep = this.store.selectSnapshot(RegistrationSelectors.currentStep);
		this.currentStep.set(initialStep);
	}

	onRoleSelected(role: 'mentee' | 'mentor') {
		this.store.dispatch(new RegistrationActions.RoleSelected(role));
		this.currentStep.set(role);
	}

	onBackToRoleSelection() {
		this.store.dispatch(new RegistrationActions.BackToRoleSelection());
		this.currentStep.set('choose-role');
	}
}
