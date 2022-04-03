import { html, render } from "lit-html";

import ViewBase from "./viewBase";

import AuthService from "../repository/authorizationService";
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile'

export default class UserProfile extends ViewBase {
	constructor(sidebar, depts) {
		super(depts);
		this.sidebar = sidebar;
		this.depts = depts;
		this.settingsRepo = depts.settingsPrimitive();
		this.authService = new AuthService();
		this.messageDialogId = "messageDialog";
		this.profile = {};
	}

	template() {
		return html`
			<div class="w3-container w3-margin-top">
				<div class="w3-container w3-center">
					<i class="fa fa-user" style="font-size: 4rem; color: #777;"></i>
				</div>
				<p><b>${this.t("authLabelUsername")}:</b> ${this.profile.username}</p>
				<p><b>${this.t("authLabelEmail")}:</b> ${this.profile.email}</p>
			</div>
			<div class="w3-container w3-center">
				<label id="reset-link" @click="${() => this.onSendPasswordResetLink()}" class="link-text">
					${this.t("authForgotPasswordLink")}
				</label>
				<br />
				<label @click="${() => this.onShowMyTariffs()}" class="link-text">${this.t("manageMyTariffsLink")}</label>
				<br />
				<button class="w3-btn pc-secondary w3-margin-top" @click="${() => this.onLogout()}">Logout</button>
			</div>
		`;
	}

	async loadProfileInfo() {
		try {
			const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();
			this.profile = tokenWithProfile.profile;
		} catch (error) {
			// TODO: Handle error here
		}
	}

	successfulRegistrationTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button
						@click="${() => this.onCloseModal()}"
						class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close"
					>
						<img class="inverted" class="w3-button" src="img/close.svg" />
					</button>
				</div>
				<div class="w3-container">
					<div class="w3-section">${this.t("authForgotPasswordSuccessfulText")}</div>
				</div>
			</div>
		`;
	}

	async onSendPasswordResetLink() {
		try {
			await this.authService.requestPasswordChange({ email: this.profile.email });

			render(this.successfulRegistrationTemplate(), this.getEl(this.messageDialogId));
			this.show(this.messageDialogId);
		} catch (error) {
			console.log("ERROR!", error)
			// TODO: Handle error here
		}
	}

	onShowMyTariffs() {
		this.sidebar.open("manageMyTariffs");
	}

	onCloseModal() {
		this.hide(this.messageDialogId);
	}

	onLogout() {
		this.settingsRepo.authTokens().clear();

		location.reload(true);
	}

	async render() {
		await this.loadProfileInfo();
		render(this.template(), this.getEl("userProfileContent"));
	}
}
