import { html, render } from "lit-html";

import ViewBase from "./viewBase";

import { decodeToken } from "../helper/authorization";
import AuthService from "../repository/authorizationService";

export default class UserProfile extends ViewBase {
	constructor(sidebar, depts) {
		super(depts);
		this.sidebar = sidebar;
		this.depts = depts;
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
				<label id="reset-link" @click="${(event) => this.onSendPasswordResetLink(event)}" class="link-text">
					${this.t("authForgotPasswordLink")}
				</label>
				<br />
				<label @click="${() => this.onShowMyTariffs()}" class="link-text">${this.t("manageMyTariffsLink")}</label>
				<br />
				<button class="w3-btn pc-secondary w3-margin-top" @click="${() => this.onLogout()}">Logout</button>
			</div>
		`;
	}

	getProfile() {
		return this.profile;
	}

	getProfileInfo() {
		try {
			// TODO: Should be moved to authentication helper class
			const token = localStorage.getItem("chrprice_access");
			const { username, email } = decodeToken(token);

			this.profile = {
				username,
				email,
			};
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

	async onSendPasswordResetLink(event) {
		try {
			// TODO: Should be moved to authentication helper class
			const token = localStorage.getItem("chrprice_access");
			const { email } = decodeToken(token);
			const result = await this.authService.requestPasswordChange({ email });

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
		localStorage.removeItem("chrprice_access");
		localStorage.removeItem("chrprice_refresh");

		this.hide("sidebar");
		this.getEl("auth-options").classList.toggle("hidden");
		this.getEl("auth-profile").classList.toggle("hidden");
	}

	render() {
		this.getProfileInfo();
		render(this.template(), this.getEl("userProfileContent"));
	}
}
