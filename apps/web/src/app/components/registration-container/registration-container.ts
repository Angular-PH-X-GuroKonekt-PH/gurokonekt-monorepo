import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { RoleSelection } from '../role-selection/role-selection';
import { Register } from '../mentee/register/register';
import { MentorRegister } from '../mentor/register/register';
import { RegistrationState, RegistrationStep } from '../../store/registration';
import * as RegistrationActions from '../../store/registration/registration.actions';

@Component({
	selector: 'app-registration-container',
	standalone: true,
	imports: [RoleSelection, Register, MentorRegister],
	templateUrl: './registration-container.html',
	styleUrl: './registration-container.scss'
})
export class RegistrationContainer implements OnInit {
	private store = inject(Store);
	private route = inject(ActivatedRoute);

	protected currentStep = signal<RegistrationStep>('choose-role');

	ngOnInit() {
		// Initialize from query params once using snapshot (no subscription)
		const step = this.route.snapshot.queryParams['step'];
		this.store.dispatch(new RegistrationActions.InitializeFromQueryParams(step));
		
		// Get initial state and update signal
		const initialStep = this.store.selectSnapshot(RegistrationState.currentStep);
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
