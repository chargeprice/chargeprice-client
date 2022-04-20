import { html, render } from "lit-html";

import ViewBase from './viewBase';

import ModalFeedback from '../modal/feedback';
import AuthService from '../repository/authorizationService';
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
		this.map = null;

		this.menuItems = [
			{
				id: "resetpassword",
				title: this.t("authForgotPasswordLink"),
				icon: "envelope-o",
				action: ()=>this.onSendPasswordResetLink()
			},
			{
				id: "tariffs",
				title: this.t("manageMyTariffsLink"),
				icon: "bars",
				action: ()=>this.onShowMyTariffs()
			},
			{
				id: "feedback",
				title: this.t("fbGiveFeedback"),
				icon: "comment",
				action: ()=>this.onGiveFeedback("other_feedback")
			},
			{
				id: "missing_station",
				title: this.t("fbReportMissingStationHeader"),
				icon: "comment",
				action: ()=>this.onMissingStation()
			},
		];
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
			<div class="w3-container w3-center" style="padding: 0">
				<div class="w3-row">
					<div class="w3-bar-block">
						${this.menuItems.filter(entry => !entry.show || entry.show()).map(entry => html`
							<a @click="${() =>this.executeAction(entry)}" href="#" class="w3-bar-item w3-button w3-border-bottom">
								<i class="fa fa-${entry.icon} pc-main-text"></i> <span class="${entry.class}">${entry.title}</span>
								${entry.subTitle ? html`<span class="w3-small w3-block w3-text-dark-gray">${entry.subTitle}</span>` : ""}
							</a>
						`)}
					</div>
				</div>

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

  executeAction(entry){
    entry.action();
  }

	onGiveFeedback(type) {
		new ModalFeedback(this.depts).show(type);
	}

	onMissingStation() {
		alert(this.t("fbMissingStationSelectOnMap"));

		this.map.registerClickOnce(event => {
			new ModalFeedback(this.depts).show("missing_station", { location: event.location });
		});
	}

	async render() {
		await this.loadProfileInfo();
		render(this.template(), this.getEl("userProfileContent"));
	}
}
