import { html, render } from "lit-html";

import ViewBase from './viewBase';

import ModalFeedback from '../modal/feedback';
import ModalActivateProducts from '../modal/activateProducts';
import AuthService from '../repository/authorizationService';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile'

export default class UserProfile extends ViewBase {
	constructor(sidebar, depts, userSettings) {
		super(depts);
		this.sidebar = sidebar;
		this.depts = depts;
		this.settingsRepo = depts.settingsPrimitive();
		this.authService = new AuthService();
		this.messageDialogId = "messageDialog";
		this.themeLoader = depts.themeLoader();
		this.customConfig = depts.customConfig();
		this.profile = {};
		this.accessToken = null;
		this.map = null;
		this.userSettings = userSettings;
		this.playLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    	this.iosLink = "https://apps.apple.com/us/app/chargeprice/id1552707493";

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
				id: "activate_products",
				title: this.t("activateProductsBtn"),
				icon: "basket-shopping",
				action: ()=>this.onActivateProducts()
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
				${this.userSettings.isPro ? html`<p><b>Chargeprice.pro</b> <i class="fa fa-check-circle w3-large"></i></p>` : 
					this.accountNotActivatedTemplate()}

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

				<br><br><br>

				<span class="w3-link" @click="${()=>this.deleteAccount()}">${this.t("deleteAccountLabel")}</span>
			</div>
		`;
	}

	accountNotActivatedTemplate() {
		if(!this.themeLoader.isDefaultTheme() || !this.customConfig.paywallEnabled()) return "";

		return html`
		<div class="w3-panel w3-pale-blue w3-leftbar w3-border-blue w3-margin-top" style="border-radius:6px;">
			<p><strong>${this.t("paywallWebPaidCardHeader")}</strong></p>
			<p>${this.t("paywallWebPaidCardText")}</p>

			<div class="w3-margin-bottom">
              <a href="${this.iosLink}" target="_blank" style="text-decoration:none;">
                <img src="img/store/app-store-badge.png" alt="Download on the App Store" style="max-width:150px;height:auto;">
              </a>
              <a href="${this.playLink}" target="_blank" style="text-decoration:none;">
                <img src="img/store/play-store-badge.png" alt="Get it on Google Play" style="max-width:150px;height:auto;">
              </a>
            </div>
		</div>

		<div class="w3-panel w3-pale-red w3-leftbar w3-border-red w3-margin-top" style="border-radius:6px;">
			<p><strong>${this.t("paywallLoggedInNotActivated")}</strong></p>
			<p>${this.t("paywallLoggedInProText")}</p>
			<button @click="${()=>this.onRequestQuote()}" class="w3-btn w3-light-grey w3-small w3-margin-bottom">${this.t("paywallRequestQuoteCta")}</button>
			<p>${this.t("paywallLoggedInPrivateText")}</p>
			<button @click="${()=>this.onRequestWebAppAccess()}" class="w3-btn w3-light-grey w3-small w3-margin-bottom">${this.t("paywallLoggedInRequestAccess")}</button>
		</div>
		`;
	}

	async loadProfileInfo() {
		try {
			const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();
			this.profile = tokenWithProfile.profile;
			this.accessToken = tokenWithProfile.accessToken;
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

	async deleteAccount(){
		const response = confirm(this.t("confirmDeleteAccount"))

		if(!response) return;

		await this.authService.deleteAccount(this.profile.userId, this.accessToken);

		this.onLogout();
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

	onActivateProducts() {
		new ModalActivateProducts(this.depts).show();
	}

	onGiveFeedback(type) {
		new ModalFeedback(this.depts).show(type);
	}

	onRequestWebAppAccess() {
		new ModalFeedback(this.depts).show("other_feedback", { defaultText: "I am a Premium member on the mobile app and want to get access to the web app." });
	}

	onRequestQuote() {
		window.open(this.t("paywallDotNetQuotePro"), "_blank");
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
