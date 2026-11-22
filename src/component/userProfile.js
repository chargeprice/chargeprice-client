import { html, render } from "lit-html";

import ViewBase from './viewBase';

import ModalActivateProducts from '../modal/activateProducts';
import ModalStripeCheckout, { FEATURES as PREMIUM_FEATURES } from '../modal/stripeCheckout';
import AuthService from '../repository/authorizationService';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile'
import { isExpertMode, setExpertMode } from '../helper/expertMode';
import Authorization from './authorization';
import { getColorMode, setColorMode } from '../helper/darkMode';
import { getMyPlaces, setMyPlace, PLACE_TYPES } from '../helper/myPlaces';
import LocationIQ from '../repository/locationIQ';
import { buildSpecimenInvoice, downloadBlob } from '../helper/specimenInvoicePdf';

// Mobile app banner of the account panel: hidden after closing, until the next login
const APP_BANNER_KEY = "cp-account-app-banner-dismissed";
function isAppBannerDismissed() {
	try { return localStorage.getItem(APP_BANNER_KEY) === "1"; } catch (e) { return false; }
}
function dismissAppBanner() {
	try { localStorage.setItem(APP_BANNER_KEY, "1"); } catch (e) {}
}
export function resetAppBanner() {
	try { localStorage.removeItem(APP_BANNER_KEY); } catch (e) {}
}

// Settings without a backend yet (mockup): kept in this browser only
const PREFS_KEY = "cp-account-prefs";
function getAccountPrefs() {
	try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {}; } catch (e) { return {}; }
}
function setAccountPref(key, value) {
	const prefs = getAccountPrefs();
	prefs[key] = value;
	try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
}

export default class UserProfile extends ViewBase {
	constructor(sidebar, depts, userSettings) {
		super(depts);
		this.sidebar = sidebar;
		this.depts = depts;
		this.settingsRepo = depts.settingsPrimitive();
		this.authService = depts.auth();
		this.messageDialogId = "messageDialog";
		this.themeLoader = depts.themeLoader();
		this.customConfig = depts.customConfig();
		this.profile = {};
		this.accessToken = null;
		this.map = null;
		this.userSettings = userSettings;
		this.playLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    	this.iosLink = "https://apps.apple.com/us/app/chargeprice/id1552707493";

		// Other parts of the app can open a given account page (e.g. the subscription for Premium users)
		depts.eventBus().subscribe("account.page", (page) => {
			this.accountPage = page;
			// Opened for the subscription (premium screen, back from Stripe): show it unfolded
			this.planExpanded = page === "invoices";
		});

		this.menuItems = [
			{
				id: "resetpassword",
				title: this.t("authForgotPasswordLink"),
				icon: "envelope-o",
				action: ()=>this.onSendPasswordResetLink()
			},
			{
				id: "activate_products",
				title: this.t("activateProductsBtn"),
				icon: "basket-shopping",
				action: ()=>this.onActivateProducts()
			},
		];
	}

	// Layout inspired by the 2025 "Chargeprice.app Mockup Premium": identity header, a menu of
	// separate pages (Profile incl. subscription, Settings, Invoices, Feedback), then log out.
	template() {
		const isPremium = this.userSettings.isPro || this.userSettings.isMobilePremium;
		const page = this.accountPage || "profile";
		const pages = [
			["profile", "fa-id-card", this.t("accountProfileTitle")],
			["settings", "fa-sliders", this.t("accountSettingsTitle")],
			["invoices", "fa-crown", this.t("accountPlanInvoicesTab")],
			["feedback", "fa-headset", this.t("accountFeedbackTab")],
		];
		return html`
			<div class="account-page">
				${this.appBannerTemplate()}

				<nav class="account-nav" role="tablist">
					${pages.map(([id, icon, label]) => html`
						<button type="button" role="tab" aria-selected="${page === id}"
							class="account-nav-item ${page === id ? "active" : ""}" @click="${()=>this.onSelectPage(id)}">
							<i class="fa ${icon}"></i><span>${label}</span>
						</button>
					`)}
				</nav>

				<div class="account-page-content" role="tabpanel">
					${page === "profile" ? this.profilePageTemplate(isPremium) : ""}
					${page === "settings" ? this.settingsPageTemplate() : ""}
					${page === "invoices" ? this.planPageTemplate(isPremium) : ""}
					${page === "feedback" ? this.supportPageTemplate() : ""}
				</div>

				<section class="account-card account-card-list">
					<a href="#" class="account-list-item account-logout account-logout-only" @click="${(e) => { e.preventDefault(); this.onLogout(); }}">
						<i class="fa fa-right-from-bracket account-list-icon"></i>
						<span class="account-list-text">${this.t("accountLogout")}</span>
					</a>
				</section>

				<div class="account-delete">
					<span class="w3-link" @click="${()=>this.deleteAccount()}">${this.t("deleteAccountLabel")}</span>
				</div>
			</div>
		`;
	}

	// Promotes the mobile apps. Once closed, it stays hidden until the next login
	// (the flag is cleared by Authorization.saveAuthResult and by the logout).
	appBannerTemplate() {
		if (isAppBannerDismissed()) return "";
		return html`
			<div class="account-app-banner" style="background-image:url('img/hero-background.jpg');">
				<button type="button" class="account-app-banner-close" aria-label="Close" title="Close" @click="${()=>this.onCloseAppBanner()}">
					<i class="fa fa-xmark"></i>
				</button>
				<div class="account-app-banner-content">
					<p class="account-app-banner-title"><i class="fa fa-mobile-screen-button"></i> ${this.t("premiumAppTitle")}</p>
					<p class="account-app-banner-text">${this.t("accountAppBannerText")}</p>
					<div class="account-app-banner-badges">
						<a href="${this.iosLink}" target="_blank" rel="noopener" @click="${()=>this.onAppBannerClicked("ios")}">
							<img src="img/store/app-store-badge.png" alt="Download on the App Store">
						</a>
						<a href="${this.playLink}" target="_blank" rel="noopener" @click="${()=>this.onAppBannerClicked("android")}">
							<img src="img/store/play-store-badge.png" alt="Get it on Google Play">
						</a>
					</div>
				</div>
			</div>
		`;
	}

	onCloseAppBanner() {
		dismissAppBanner();
		render(this.template(), this.getEl("userProfileContent"));
	}

	onAppBannerClicked(platform) {
		try { this.depts.analytics().log('event', 'app_install_clicked', { platform: platform, source: 'account_banner' }); } catch (e) {}
	}

	onSelectPage(page) {
		this.accountPage = page;
		render(this.template(), this.getEl("userProfileContent"));
		const sidebar = this.getEl("sidebar");
		if (sidebar) sidebar.scrollTop = 0;
	}

	// Profile page: personal data
	profilePageTemplate(isPremium) {
		return html`
			${this.profileFormTemplate()}
		`;
	}

	// "Plan & invoices" page: compact plan block (unfolds into the premium screen), invoices,
	// then the hint for professionals at the very bottom
	planPageTemplate(isPremium) {
		return html`
			${this.subscriptionCardTemplate(isPremium)}
			${!isPremium ? this.accountNotActivatedTemplate() : ""}
			${this.themeLoader.getCurrentThemeId() === 'emc' ? this.emcAppPromoTemplate() : ''}
			${this.invoicesMockTemplate()}
			${this.themeLoader.isDefaultTheme() ? html`<div class="account-data-platform">${this.premiumScreen().dataPlatformTemplate()}</div>` : ""}
		`;
	}

	// Settings page. Real settings: dark mode, language, currency, expert mode.
	// VISUAL MOCKUP ONLY (kept in this browser, nothing sent): country, notifications,
	// price alerts and newsletter - the app has no backend for them yet.
	settingsPageTemplate() {
		const translation = this.depts.translation();
		const currency = this.depts.currency();
		const prefs = getAccountPrefs();
		return html`
			<section class="account-card">
				<h3 class="account-card-title"><i class="fa fa-sliders"></i> ${this.t("accountSettingsTitle")}</h3>
				<div class="account-setting-row">
					<span class="account-setting-label"><i class="fa fa-moon pc-main-text"></i> ${this.t("accountDarkMode")}</span>
					${this.colorModeTemplate()}
				</div>
				<label class="account-setting-row">
					<span class="account-setting-label"><i class="fa fa-language pc-main-text"></i> ${this.t("accountLanguage")}</span>
					<select class="account-select" @change="${(e)=>translation.changeLocale(e.target.value)}">
						${translation.getSupportedLocales().map(l => html`<option value="${l.code}" ?selected="${l.code === translation.currentLocale}">${l.name}</option>`)}
					</select>
				</label>
				<label class="account-setting-row">
					<span class="account-setting-label"><i class="fa fa-coins pc-main-text"></i> ${this.t("accountCurrency")}</span>
					<select class="account-select" @change="${(e)=>this.onChangeCurrency(e.target.value)}">
						${currency.getAvailableCurrencies().map(c => html`<option value="${c}" ?selected="${c === currency.getDisplayedCurrency()}">${c}</option>`)}
					</select>
				</label>
				<label class="account-setting-row">
					<span class="account-setting-label"><i class="fa fa-earth-europe pc-main-text"></i> ${this.t("accountCountry")}
						<span class="account-mock-chip">${this.t("accountMockShort")}</span></span>
					<select class="account-select" @change="${(e)=>this.onSetPref("country", e.target.value)}">
						<option value="" ?selected="${!prefs.country}">–</option>
						${this.countryOptions().map(c => html`<option value="${c.code}" ?selected="${c.code === prefs.country}">${c.name}</option>`)}
					</select>
				</label>
				${this.expertModeTemplate()}
			</section>

			<section class="account-card account-mock">
				<span class="account-mock-badge"><i class="fa fa-eye"></i> ${this.t("accountMockBadge")}</span>
				<h3 class="account-card-title"><i class="fa fa-bell"></i> ${this.t("accountNotificationsTitle")}</h3>
				${[
					["notifications", "fa-bell", "accountNotifications", "accountNotificationsText"],
					["priceAlerts", "fa-tag", "accountPriceAlerts", "accountPriceAlertsText"],
					["newsletter", "fa-envelope-open-text", "accountNewsletter", "accountNewsletterText"],
				].map(([key, icon, title, text]) => this.prefSwitchTemplate(key, icon, title, text, !!prefs[key]))}
			</section>

			${this.actionsTemplate(["resetpassword"])}
		`;
	}

	prefSwitchTemplate(key, icon, title, text, on) {
		return html`
			<label class="expert-mode-row account-pref-row cp-clickable" for="pref-${key}">
				<span class="expert-mode-text">
					<span class="expert-mode-title"><i class="fa ${icon} pc-main-text"></i> ${this.t(title)}</span>
					<span class="expert-mode-sub">${this.t(text)}</span>
				</span>
				<span class="cp-switch">
					<input type="checkbox" id="pref-${key}" role="switch" .checked="${on}" aria-checked="${on}"
						@change="${(e)=>this.onSetPref(key, e.target.checked)}">
					<span class="cp-switch-track"><span class="cp-switch-thumb"></span></span>
				</span>
			</label>
		`;
	}

	onSetPref(key, value) {
		setAccountPref(key, value);
		render(this.template(), this.getEl("userProfileContent"));
	}

	// Same as the currency selector of the left panel (prices are recalculated)
	onChangeCurrency(value) {
		if (this.sidebar.settingsView) this.sidebar.settingsView.currencyChanged(value);
		else this.depts.currency().changeCurrency(value);
		render(this.template(), this.getEl("userProfileContent"));
	}

	countryOptions() {
		const codes = ["AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB", "HR", "HU", "IE", "IT", "LU", "NL", "NO", "PL", "PT", "SE", "SI", "SK"];
		let names = null;
		try { names = new Intl.DisplayNames([this.depts.translation().currentLocale], { type: "region" }); } catch (e) {}
		return codes
			.map(code => ({ code, name: names ? names.of(code) : code }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	actionsTemplate(ids) {
		const entries = this.menuItems.filter(entry => ids.includes(entry.id) && (!entry.show || entry.show()));
		if (!entries.length) return "";
		return html`
			<section class="account-card account-card-list">
				${entries.map(entry => html`
					<a @click="${(e) =>{e.preventDefault(); this.executeAction(entry);}}" href="#" class="account-list-item">
						<i class="fa fa-${entry.icon} pc-main-text account-list-icon"></i>
						<span class="account-list-text ${entry.class || ""}">${entry.title}</span>
						<i class="fa fa-chevron-right account-list-chevron"></i>
					</a>
				`)}
			</section>
		`;
	}

	// VISUAL MOCKUP ONLY: the fields can be edited, but nothing is sent. The web client has no
	// call to change the username, email or password (chargeprice-auth not checked yet).
	// Read-only by default; "Edit my info" unlocks the fields, then Save / Cancel.
	profileFormTemplate() {
		const editing = !!this.editingProfile;
		return html`
			<section class="account-card account-mock ${editing ? "account-editing" : ""}">
				<span class="account-mock-badge"><i class="fa fa-eye"></i> ${this.t("accountMockBadge")}</span>
				<h3 class="account-card-title"><i class="fa fa-id-card"></i> ${this.t("accountProfileTitle")}</h3>
				<form class="account-form" @submit="${(e)=>{ e.preventDefault(); this.onSaveProfileMock(); }}">
					<label class="account-field">
						<span class="account-field-label">${this.t("authLabelUsername")}</span>
						<input class="account-input" type="text" name="account_username" autocomplete="username" ?readonly="${!editing}" .value="${this.profile.username || ""}">
					</label>
					<label class="account-field">
						<span class="account-field-label">${this.t("authLabelEmail")}</span>
						<input class="account-input" type="email" name="account_email" autocomplete="email" ?readonly="${!editing}" .value="${this.profile.email || ""}">
					</label>
					<label class="account-field">
						<span class="account-field-label">${this.t("authLabelPassword")}</span>
						<span class="account-input-wrap">
							<input class="account-input" type="password" id="account-password" name="account_password" autocomplete="new-password" placeholder="••••••••" ?readonly="${!editing}" .value="">
							${editing ? html`<button type="button" class="account-eye" aria-label="Show password" @click="${(e)=>this.onTogglePassword(e)}"><i class="fa fa-eye"></i></button>` : ""}
						</span>
					</label>
					${PLACE_TYPES.map(type => {
						const place = getMyPlaces()[type.id];
						return html`
							<label class="account-field account-place-field">
								<span class="account-field-label">${this.t(type.id === "home" ? "accountHome" : "accountOffice")}</span>
								<span class="account-place-row">
									${place && place.latitude != null ? html`
										<button type="button" class="account-place-icon my-place-${type.id} clickable"
											title="${this.t("accountShowOnMap")}" aria-label="${this.t("accountShowOnMap")}: ${place.address}"
											@click="${(e)=>{ e.preventDefault(); this.onShowPlaceOnMap(place); }}"><i class="fa ${type.icon}"></i></button>
									` : html`<span class="account-place-icon my-place-${type.id}" aria-hidden="true"><i class="fa ${type.icon}"></i></span>`}
									<input class="account-input" type="text" name="account_place_${type.id}" autocomplete="street-address" title="${place ? place.address : ""}"
										placeholder="${editing ? this.t("accountAddressPlaceholder") : "–"}" ?readonly="${!editing}" .value="${place ? place.address : ""}">
								</span>
							</label>
						`;
					})}
					${this.placesError ? html`<p class="w3-text-red w3-small account-places-error">${this.placesError}</p>` : ""}
					${editing ? html`
						<div class="account-form-actions">
							<button type="button" class="w3-btn account-btn-secondary" @click="${()=>this.onEditProfile(false)}">${this.t("accountCancel")}</button>
							<button type="submit" class="w3-btn pc-secondary">${this.t("accountSave")}</button>
						</div>
					` : html`
						<button type="button" class="w3-btn pc-secondary account-plan-btn" @click="${()=>this.onEditProfile(true)}">
							<i class="fa fa-pen"></i> ${this.t("accountEditInfo")}
						</button>
					`}
				</form>
			</section>
		`;
	}

	// Zooms the map on the home / office address
	onShowPlaceOnMap(place) {
		if (!this.map) return;
		// On phones the panel covers the map: close it to show the place
		if (window.innerWidth <= 500) this.sidebar.close();
		this.map.centerLocation({ latitude: place.latitude, longitude: place.longitude }, 16);
	}

	onEditProfile(on) {
		this.editingProfile = on;
		render(this.template(), this.getEl("userProfileContent"));
		if (!on) {
			// lit keeps typed text when the bound value did not change: put the saved values back
			const set = (name, value) => { const el = document.querySelector(`[name="${name}"]`); if (el) el.value = value; };
			set("account_username", this.profile.username || "");
			set("account_email", this.profile.email || "");
			set("account_password", "");
			const places = getMyPlaces();
			PLACE_TYPES.forEach(type => set(`account_place_${type.id}`, places[type.id] ? places[type.id].address : ""));
			this.placesError = null;
			const pwd = this.getEl("account-password");
			if (pwd) pwd.type = "password";
		}
		if (on) {
			const first = document.querySelector('[name="account_username"]');
			if (first) first.focus();
		}
	}

	onTogglePassword(event) {
		const input = this.getEl("account-password");
		const show = input.type === "password";
		input.type = show ? "text" : "password";
		event.currentTarget.querySelector("i").className = `fa ${show ? "fa-eye-slash" : "fa-eye"}`;
	}

	// Home / office are really saved (in this browser, geocoded with LocationIQ).
	// Username, email and password stay a preview: nothing is sent for them.
	async onSaveProfileMock() {
		this.placesError = null;
		const notFound = [];
		for (const type of PLACE_TYPES) {
			const input = document.querySelector(`[name="account_place_${type.id}"]`);
			const text = input ? input.value.trim() : "";
			const current = getMyPlaces()[type.id];
			if (!text) { if (current) setMyPlace(type.id, null); continue; }
			if (current && current.address === text) continue;
			try {
				const results = await new LocationIQ(this.depts).getAutocomplete(text);
				if (!results.length) { notFound.push(text); continue; }
				const best = results[0];
				setMyPlace(type.id, { address: best.name, latitude: best.latitude, longitude: best.longitude });
			} catch (error) {
				notFound.push(text);
			}
		}

		if (notFound.length) {
			// Stay in edit mode so the address can be corrected
			this.placesError = `${this.t("accountAddressNotFound")}: ${notFound.join(", ")}`;
			render(this.template(), this.getEl("userProfileContent"));
			return;
		}

		const snackbar = this.getEl("snackbar");
		if (snackbar) {
			snackbar.innerText = this.t("accountPlacesSaved");
			snackbar.style.display = "block";
			setTimeout(() => snackbar.style.display = "none", 5000);
		}
		this.onEditProfile(false);
	}

	// VISUAL MOCKUP ONLY (2025 Premium mockup): the API does not provide invoices or support
	// tickets yet. The rows below are example data, labelled as such in the page.
	invoicesMockTemplate() {
		const rows = this.specimenInvoices();
		return html`
			<section class="account-card account-mock">
				<span class="account-mock-badge"><i class="fa fa-eye"></i> ${this.t("accountMockBadge")}</span>
				<h3 class="account-card-title"><i class="fa fa-file-invoice"></i> ${this.t("accountInvoicesTitle")}</h3>
				<table class="account-table">
					<thead><tr><th>${this.t("accountColDate")}</th><th>${this.t("accountColInvoice")}</th><th>${this.t("accountColAmount")}</th><th>${this.t("accountColStatus")}</th><th><span class="account-sr-only">PDF</span></th></tr></thead>
					<tbody>
						${rows.map(r => html`<tr>
							<td>${r.date}</td><td>${r.number}</td><td>${r.amount.toFixed(2)} €</td>
							<td><span class="account-status paid">${this.t("accountStatusPaid")}</span></td>
							<td class="account-table-action">
								<button type="button" class="account-download" title="${this.t("accountDownloadPdf")}" aria-label="${this.t("accountDownloadPdf")} ${r.number}"
									@click="${()=>this.onDownloadInvoice(r)}"><i class="fa fa-file-arrow-down"></i> PDF</button>
							</td>
						</tr>`)}
					</tbody>
				</table>
			</section>
		`;
	}

	// Example invoices: monthly web Premium (2.99 € incl. VAT), the last three months
	specimenInvoices() {
		const rows = [];
		const now = new Date();
		for (let i = 0; i < 3; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
			const fmt = x => `${String(x.getDate()).padStart(2, "0")}.${String(x.getMonth() + 1).padStart(2, "0")}.${x.getFullYear()}`;
			rows.push({
				date: fmt(d),
				period: `${fmt(d)} - ${fmt(end)}`,
				number: `SPECIMEN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
				amount: 2.99,
			});
		}
		return rows;
	}

	onDownloadInvoice(row) {
		const blob = buildSpecimenInvoice({
			number: row.number,
			date: row.date,
			period: row.period,
			amount: row.amount,
			customerName: this.profile.username,
			customerEmail: this.profile.email,
		}, {
			invoice: this.t("accountColInvoice"),
			specimenNotice: this.t("accountSpecimenNotice"),
			from: this.t("accountInvoiceFrom"),
			billedTo: this.t("accountInvoiceBilledTo"),
			date: this.t("accountColDate"),
			period: this.t("accountInvoicePeriod"),
			status: this.t("accountColStatus"),
			paid: this.t("accountStatusPaid"),
			description: this.t("accountInvoiceDescription"),
			amount: this.t("accountColAmount"),
			item: this.t("accountInvoiceItem"),
			net: this.t("accountInvoiceNet"),
			vat: this.t("accountInvoiceVat"),
			total: this.t("accountInvoiceTotal"),
			footer: this.t("accountSpecimenFooter"),
		});
		downloadBlob(blob, `${row.number}.pdf`);
	}

	ticketsMockTemplate() {
		const rows = this.specimenTickets();
		const open = this.openTicketId;
		return html`
			<section class="account-card account-mock">
				<span class="account-mock-badge"><i class="fa fa-eye"></i> ${this.t("accountMockBadge")}</span>
				<h3 class="account-card-title"><i class="fa fa-headset"></i> ${this.t("accountTicketsTitle")}</h3>
				<table class="account-table account-tickets">
					<thead><tr><th>ID</th><th>${this.t("accountColSubject")}</th><th>${this.t("accountColStatus")}</th><th><span class="account-sr-only">${this.t("accountTicketDetail")}</span></th></tr></thead>
					<tbody>
						${rows.map(r => html`
							<tr class="${open === r.id ? "open" : ""}">
								<td>${r.id}</td><td>${r.subject}</td>
								<td><span class="account-status ${r.status}">${this.t(r.status === "pending" ? "accountStatusPending" : "accountStatusResolved")}</span></td>
								<td class="account-table-action">
									<button type="button" class="account-download" aria-expanded="${open === r.id}" @click="${()=>this.onToggleTicket(r.id)}">
										${this.t("accountTicketDetail")} <i class="fa fa-chevron-${open === r.id ? "up" : "down"}"></i>
									</button>
								</td>
							</tr>
							${open === r.id ? html`
								<tr class="account-ticket-detail-row"><td colspan="4">${this.ticketThreadTemplate(r)}</td></tr>
							` : ""}
						`)}
					</tbody>
				</table>
				<button class="w3-btn pc-secondary account-plan-btn" @click="${()=>this.onGiveFeedback()}"><i class="fa fa-comment"></i> ${this.t("fbGiveFeedback")}</button>
			</section>
		`;
	}

	// "Feedbacks & Support": support tickets, tutorials, contact form
	supportPageTemplate() {
		return html`
			${this.ticketsMockTemplate()}
			${this.tutorialsTemplate()}
			${this.contactFormTemplate()}
		`;
	}

	// Short how-tos about the app's real features (open one at a time)
	tutorialsTemplate() {
		const open = this.openTutorial;
		return html`
			<section class="account-card">
				<h3 class="account-card-title"><i class="fa fa-graduation-cap"></i> ${this.t("accountTutorialsTitle")}</h3>
				<div class="account-tutorials">
					${this.tutorials().map(tuto => html`
						<div class="account-tutorial ${open === tuto.id ? "open" : ""}">
							<button type="button" class="account-tutorial-head" aria-expanded="${open === tuto.id}" @click="${()=>this.onToggleTutorial(tuto.id)}">
								<span class="account-tutorial-icon"><i class="fa ${tuto.icon}"></i></span>
								<span class="account-tutorial-title">${tuto.title}</span>
								<i class="fa fa-chevron-${open === tuto.id ? "up" : "down"} account-list-chevron"></i>
							</button>
							${open === tuto.id ? html`
								<ol class="account-tutorial-steps">${tuto.steps.map(s => html`<li>${s}</li>`)}</ol>
							` : ""}
						</div>
					`)}
				</div>
			</section>
		`;
	}

	onToggleTutorial(id) {
		this.openTutorial = this.openTutorial === id ? null : id;
		render(this.template(), this.getEl("userProfileContent"));
	}

	tutorials() {
		const lang = ["fr", "de"].includes(this.depts.translation().currentLocale) ? this.depts.translation().currentLocale : "en";
		const T = {
			en: [
				["cheapest", "fa-magnifying-glass-dollar", "Find the cheapest tariff at a station", ["Click a charging station on the map.", "Choose the charging point (power and plug) at the top of the panel.", "Adjust your charge (battery from / to, start time) with Edit.", "The tariffs are sorted by price: the first one is the cheapest for this charge."]],
				["wallet", "fa-wallet", "Add your charging cards to the Wallet", ["In the left panel, click Wallet.", "Search for your charging card or app and add it.", "Your tariffs now appear first in the price list of every station."]],
				["route", "fa-route", "Plan a trip with charging stops", ["Open the Route Planner tab in the left panel.", "Enter the starting point and the destination (add stops if needed).", "Set your consumption and battery levels, then click Calculate.", "Choose between the fastest and the cheapest route."]],
				["report", "fa-flag", "Report a wrong price or a missing station", ["Wrong price: open the tariff in a station and click Report Wrong Price.", "Missing price: use Report Missing Price below the price list.", "Missing station: click the red button at the bottom right of the map, then the location."]],
			],
			fr: [
				["cheapest", "fa-magnifying-glass-dollar", "Trouver le tarif le moins cher sur une borne", ["Cliquez sur une borne sur la carte.", "Choisissez le point de charge (puissance et prise) en haut du panneau.", "Ajustez votre recharge (batterie de / à, heure de départ) avec Modifier.", "Les tarifs sont triés par prix : le premier est le moins cher pour cette recharge."]],
				["wallet", "fa-wallet", "Ajouter vos cartes de recharge au Wallet", ["Dans le panneau de gauche, cliquez sur Wallet.", "Cherchez votre carte ou application de recharge et ajoutez-la.", "Vos tarifs apparaissent désormais en premier dans la liste des prix de chaque borne."]],
				["route", "fa-route", "Planifier un trajet avec des arrêts recharge", ["Ouvrez l'onglet Route Planner dans le panneau de gauche.", "Indiquez le départ et la destination (ajoutez des étapes si besoin).", "Réglez la consommation et les niveaux de batterie, puis cliquez sur Calculer.", "Choisissez entre l'itinéraire le plus rapide et le moins cher."]],
				["report", "fa-flag", "Signaler un prix erroné ou une borne manquante", ["Prix erroné : ouvrez le tarif sur une borne et cliquez sur Report Wrong Price.", "Prix manquant : utilisez Report Missing Price sous la liste des prix.", "Borne manquante : cliquez sur le bouton rouge en bas à droite de la carte, puis sur l'emplacement."]],
			],
			de: [
				["cheapest", "fa-magnifying-glass-dollar", "Den günstigsten Tarif an einer Station finden", ["Klicke auf der Karte auf eine Ladestation.", "Wähle oben im Panel den Ladepunkt (Leistung und Stecker).", "Passe deinen Ladevorgang (Akku von / bis, Startzeit) mit Bearbeiten an.", "Die Tarife sind nach Preis sortiert: der erste ist der günstigste für diesen Ladevorgang."]],
				["wallet", "fa-wallet", "Deine Ladekarten zum Wallet hinzufügen", ["Klicke im linken Panel auf Wallet.", "Suche deine Ladekarte oder App und füge sie hinzu.", "Deine Tarife erscheinen jetzt zuerst in der Preisliste jeder Station."]],
				["route", "fa-route", "Eine Route mit Ladestopps planen", ["Öffne den Tab Route Planner im linken Panel.", "Gib Start und Ziel ein (füge bei Bedarf Zwischenstopps hinzu).", "Stelle Verbrauch und Akkustände ein und klicke auf Berechnen.", "Wähle zwischen der schnellsten und der günstigsten Route."]],
				["report", "fa-flag", "Falschen Preis oder fehlende Station melden", ["Falscher Preis: Öffne den Tarif an einer Station und klicke auf Report Wrong Price.", "Fehlender Preis: Nutze Report Missing Price unter der Preisliste.", "Fehlende Station: Klicke auf den roten Button unten rechts auf der Karte und dann auf den Ort."]],
			],
		}[lang];
		return T.map(([id, icon, title, steps]) => ({ id, icon, title, steps }));
	}

	// VISUAL MOCKUP ONLY: the form is not sent (no support backend in the web app yet)
	contactFormTemplate() {
		return html`
			<section class="account-card account-mock">
				<span class="account-mock-badge"><i class="fa fa-eye"></i> ${this.t("accountMockBadge")}</span>
				<h3 class="account-card-title"><i class="fa fa-envelope"></i> ${this.t("accountContactTitle")}</h3>
				<form class="account-form" @submit="${(e)=>{ e.preventDefault(); this.onSendContactMock(e.target); }}">
					<label class="account-field">
						<span class="account-field-label">${this.t("authLabelEmail")}</span>
						<input class="account-input" type="email" name="contact_email" autocomplete="email" .value="${this.profile.email || ""}" required>
					</label>
					<label class="account-field">
						<span class="account-field-label">${this.t("accountColSubject")}</span>
						<select class="account-select account-select-full" name="contact_topic">
							<option value="question">${this.t("accountTopicQuestion")}</option>
							<option value="subscription">${this.t("accountTopicSubscription")}</option>
							<option value="data">${this.t("accountTopicData")}</option>
							<option value="bug">${this.t("accountTopicBug")}</option>
							<option value="other">${this.t("accountTopicOther")}</option>
						</select>
					</label>
					<label class="account-field">
						<span class="account-field-label">${this.t("accountContactMessage")}</span>
						<textarea class="account-input account-textarea" name="contact_message" rows="5" required placeholder="${this.t("accountContactPlaceholder")}"></textarea>
					</label>
					<button type="submit" class="w3-btn pc-secondary account-plan-btn"><i class="fa fa-paper-plane"></i> ${this.t("accountContactSend")}</button>
				</form>
			</section>
		`;
	}

	onSendContactMock(form) {
		const snackbar = this.getEl("snackbar");
		if (snackbar) {
			snackbar.innerText = this.t("accountContactNotSent");
			snackbar.style.display = "block";
			setTimeout(() => snackbar.style.display = "none", 5000);
		}
		const message = form.querySelector('[name="contact_message"]');
		if (message) message.value = "";
	}

	onToggleTicket(id) {
		this.openTicketId = this.openTicketId === id ? null : id;
		render(this.template(), this.getEl("userProfileContent"));
	}

	// Conversation: the user's message, then the answers of the Chargeprice data managers
	ticketThreadTemplate(ticket) {
		return html`
			<div class="account-thread">
				${ticket.messages.map(m => html`
					<div class="account-msg ${m.from === "user" ? "from-user" : "from-team"}">
						<div class="account-msg-head">
							<span class="account-msg-avatar">${m.from === "user" ? this.initials() : html`<i class="fa fa-bolt"></i>`}</span>
							<span class="account-msg-author">${m.from === "user" ? this.profile.username : m.author}</span>
							${m.from === "team" ? html`<span class="account-msg-role">${this.t("accountDataManager")}</span>` : ""}
							<span class="account-msg-date">${m.date}</span>
						</div>
						<p class="account-msg-text">${m.text}</p>
					</div>
				`)}
			</div>
		`;
	}

	// VISUAL MOCKUP ONLY: fictitious support conversations (no real users or messages).
	// Written in English, French and German; other languages get the English version.
	specimenTickets() {
		const lang = ["fr", "de"].includes(this.depts.translation().currentLocale) ? this.depts.translation().currentLocale : "en";
		const T = {
			en: {
				s1: "Missing station in Salzburg-Itzling",
				m1: "Hello, there is a new 150 kW charging station on the car park of the Itzling shopping centre (2 CCS plugs). It doesn't show up on the map yet.",
				r1: "Thanks a lot for the report! We have forwarded it to the operator and asked for the data. The station should appear in the next update, usually within a week.",
				s2: "Wrong price for Ionity with my card",
				m2: "The app shows 0.39 €/kWh for Ionity with my charging card, but I paid 0.59 €/kWh yesterday at Wals.",
				r2a: "Thanks for the details! The operator changed its prices on 1 November and our data hadn't been updated yet.",
				r2b: "The price is now corrected: 0.59 €/kWh. Thanks again for your help, it benefits all users!",
				m2b: "Perfect, it's correct now. Thank you!",
				s3: "Suggestion: filter for 24/7 stations",
				m3: "It would be great to be able to show only stations that are open 24/7.",
				r3: "Great idea, thanks! We've added it to our list of suggestions for the route planner and the map filters.",
			},
			fr: {
				s1: "Borne manquante à Salzbourg-Itzling",
				m1: "Bonjour, il y a une nouvelle borne 150 kW sur le parking du centre commercial d'Itzling (2 prises CCS). Elle n'apparaît pas encore sur la carte.",
				r1: "Merci beaucoup pour le signalement ! Nous l'avons transmis à l'opérateur et demandé les données. La borne devrait apparaître lors de la prochaine mise à jour, en général sous une semaine.",
				s2: "Prix erroné pour Ionity avec ma carte",
				m2: "L'application affiche 0,39 €/kWh chez Ionity avec ma carte de recharge, mais j'ai payé 0,59 €/kWh hier à Wals.",
				r2a: "Merci pour les détails ! L'opérateur a changé ses prix le 1er novembre et nos données n'étaient pas encore à jour.",
				r2b: "Le prix est maintenant corrigé : 0,59 €/kWh. Merci encore pour votre aide, elle profite à tous les utilisateurs !",
				m2b: "Parfait, c'est correct maintenant. Merci !",
				s3: "Suggestion : filtre pour les bornes 24h/24",
				m3: "Ce serait super de pouvoir afficher seulement les bornes accessibles 24h/24 et 7j/7.",
				r3: "Très bonne idée, merci ! Nous l'avons ajoutée à notre liste de suggestions pour le planificateur d'itinéraire et les filtres de la carte.",
			},
			de: {
				s1: "Fehlende Ladestation in Salzburg-Itzling",
				m1: "Hallo, auf dem Parkplatz des Einkaufszentrums Itzling gibt es eine neue 150-kW-Ladestation (2 CCS-Stecker). Sie wird auf der Karte noch nicht angezeigt.",
				r1: "Vielen Dank für den Hinweis! Wir haben ihn an den Betreiber weitergeleitet und die Daten angefragt. Die Station sollte mit dem nächsten Update erscheinen, meist innerhalb einer Woche.",
				s2: "Falscher Preis bei Ionity mit meiner Karte",
				m2: "Die App zeigt 0,39 €/kWh bei Ionity mit meiner Ladekarte, aber ich habe gestern in Wals 0,59 €/kWh bezahlt.",
				r2a: "Danke für die Details! Der Betreiber hat seine Preise am 1. November geändert und unsere Daten waren noch nicht aktualisiert.",
				r2b: "Der Preis ist jetzt korrigiert: 0,59 €/kWh. Nochmals danke für deine Hilfe, davon profitieren alle Nutzer!",
				m2b: "Perfekt, jetzt stimmt es. Danke!",
				s3: "Vorschlag: Filter für 24/7-Stationen",
				m3: "Es wäre toll, nur Stationen anzeigen zu können, die rund um die Uhr zugänglich sind.",
				r3: "Super Idee, danke! Wir haben sie auf unsere Vorschlagsliste für den Routenplaner und die Kartenfilter gesetzt.",
			},
		}[lang];
		return [
			{ id: "#4921", subject: T.s1, status: "pending", messages: [
				{ from: "user", date: "18.11.2026 09:12", text: T.m1 },
				{ from: "team", author: "Lena", date: "18.11.2026 14:40", text: T.r1 },
			] },
			{ id: "#4870", subject: T.s2, status: "resolved", messages: [
				{ from: "user", date: "03.11.2026 18:05", text: T.m2 },
				{ from: "team", author: "Thomas", date: "04.11.2026 10:22", text: T.r2a },
				{ from: "team", author: "Thomas", date: "05.11.2026 16:48", text: T.r2b },
				{ from: "user", date: "05.11.2026 19:03", text: T.m2b },
			] },
			{ id: "#4702", subject: T.s3, status: "resolved", messages: [
				{ from: "user", date: "12.10.2026 21:30", text: T.m3 },
				{ from: "team", author: "Lena", date: "13.10.2026 11:15", text: T.r3 },
			] },
		];
	}

	initials() {
		const name = (this.profile.username || this.profile.email || "?").trim();
		const parts = name.split(/[\s._-]+/).filter(Boolean);
		const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
		return letters.toUpperCase();
	}

	tierLabel() {
		if (this.userSettings.isMobilePremium) return this.t("activateProductsMobilePremium");
		return this.t("activateProductsWebPro");
	}

	// Current plan, with the "Current" badge; users without Premium get the premium offer instead
	// "My Premium subscription": the content of the premium screen (features, managing the
	// subscription, data platform hint) shown in the panel instead of the popup.
	// Compact by default: "My plan: Premium / Free version" + "Manage my subscription / Get Premium".
	// The button unfolds the premium screen inside the card: features and managing / cancelling
	// for Premium users, the offer and the checkout for the others.
	subscriptionCardTemplate(isPremium) {
		const canBuy = !isPremium && this.sidebar.premiumGate.showsUpsells();
		const expanded = !!this.planExpanded;
		return html`
			<section class="account-card account-plan ${isPremium ? "" : "account-plan-free"} ${expanded ? "expanded" : ""}">
				${isPremium ? html`<span class="account-plan-badge">${this.t("accountCurrentPlan")}</span>` : ""}
				<div class="account-plan-summary">
					<span class="account-plan-name">
						<i class="fa ${isPremium ? "fa-crown" : "fa-user"}"></i>
						${this.t("accountMyPlan")}: <strong>${isPremium ? this.t("accountPlanPremium") : this.t("accountPlanFree")}</strong>
					</span>
					${isPremium || canBuy ? html`
						<button class="w3-btn pc-secondary account-plan-btn" aria-expanded="${expanded}" @click="${()=>this.onTogglePlan()}">
							<i class="fa ${isPremium ? "fa-gear" : "fa-star"}"></i>
							${isPremium ? this.t("accountManageSubscription") : this.t("accountGetPremium")}
							<i class="fa fa-chevron-${expanded ? "up" : "down"} account-plan-chevron"></i>
						</button>
					` : ""}
				</div>
				${expanded ? (isPremium ? this.premiumDetailsTemplate() : this.premiumOfferTemplate()) : ""}
			</section>
		`;
	}

	onTogglePlan() {
		this.planExpanded = !this.planExpanded;
		render(this.template(), this.getEl("userProfileContent"));
	}

	// Premium users: all the features, then managing / cancelling the subscription
	premiumDetailsTemplate() {
		const premium = this.premiumScreen();
		premium.showDetails = true;
		const stripeManaged = !!this.userSettings.isStripeManaged;
		return html`
			<div class="account-plan-details">
				${this.userSettings.isMobilePremium ? html`<p class="account-plan-line"><i class="fa fa-check"></i> ${this.t("activateProductsMobilePremium")}</p>` : ""}
				${this.userSettings.isPro ? html`<p class="account-plan-line"><i class="fa fa-check"></i> ${this.t("activateProductsWebPro")}</p>` : ""}
				<div class="account-premium-features account-premium-features-all">
					${premium.featureListTemplate(PREMIUM_FEATURES)}
				</div>
				${premium.error ? html`<p class="w3-text-red w3-small">${premium.error}</p>` : ""}
				${!stripeManaged ? html`<p class="account-plan-hint"><i class="fa fa-mobile"></i> ${this.t("accountManageInApp")}</p>` : ""}
				<button class="w3-btn account-btn-secondary account-plan-btn" ?disabled="${premium.loading}"
					@click="${()=>stripeManaged ? premium.onManageSubscription() : this.onManageStoreSubscription()}">
					${premium.loading ? html`<i class="fa fa-spinner fa-spin"></i>` : html`<i class="fa fa-arrow-up-right-from-square"></i> ${this.t("accountManageOrCancel")}`}
				</button>
			</div>
		`;
	}

	// Free users: the offer of the premium screen (free mobile app, or web Premium with checkout)
	premiumOfferTemplate() {
		const premium = this.premiumScreen();
		return html`
			<div class="account-plan-details account-premium-offer">
				${premium.purchaseTemplate()}
			</div>
		`;
	}

	// Bought in the mobile app: the subscription is managed by Apple or Google, open their page
	onManageStoreSubscription() {
		const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
		const url = isApple
			? "https://apps.apple.com/account/subscriptions"
			: "https://play.google.com/store/account/subscriptions";
		window.open(url, "_blank", "noopener");
	}

	// Reuses the premium screen's parts (feature list, Stripe portal, data platform) inside the
	// panel: it renders here instead of in the popup.
	premiumScreen() {
		if (!this.premium) {
			this.premium = new ModalStripeCheckout(this.depts);
			this.premium.rerender = () => render(this.template(), this.getEl("userProfileContent"));
		}
		this.premium.profile = this.profile;
		this.premium.accessToken = this.accessToken;
		return this.premium;
	}

	colorModeTemplate() {
		const mode = getColorMode();
		return html`
			<div class="color-mode-switch account-color-mode" role="radiogroup" aria-label="${this.t("accountAppearance")}">
				${[["light","fa-sun",this.t("accountLight")],["dark","fa-moon",this.t("accountDark")],["system","fa-desktop",this.t("accountSystem")]].map(([m, icon, label])=>html`
					<button type="button" role="radio" aria-checked="${mode === m}" aria-label="${label}" title="${label}"
						class="color-mode-option ${mode === m ? "active" : ""}" @click="${()=>this.onSetColorMode(m)}">
						<i class="fa ${icon}"></i>
					</button>
				`)}
			</div>
		`;
	}

	onSetColorMode(mode) {
		setColorMode(mode);
		render(this.template(), this.getEl("userProfileContent"));
	}

	expertModeTemplate() {
		const on = isExpertMode();
		return html`
			<label class="expert-mode-row cp-clickable" for="expert-mode-switch">
				<span class="expert-mode-text">
					<span class="expert-mode-title"><i class="fa fa-flask pc-main-text"></i> ${this.t("expertModeTitle")}</span>
					<span class="expert-mode-sub">${this.t("expertModeText")}</span>
				</span>
				<span class="cp-switch">
					<input type="checkbox" id="expert-mode-switch" role="switch" .checked="${on}" aria-checked="${on}"
						@change="${(e)=>this.onToggleExpertMode(e.target.checked)}">
					<span class="cp-switch-track"><span class="cp-switch-thumb"></span></span>
				</span>
			</label>
		`;
	}

	onToggleExpertMode(on) {
		setExpertMode(on);
		this.accountPage = "settings";
		render(this.template(), this.getEl("userProfileContent"));
	}

	premiumCardTemplate() {
		return html`
		<div class="premium-hero premium-card" style="background-image:url('img/hero-background.jpg');">
			<div class="premium-hero-content">
				<p class="header-font premium-hero-title">
					<i class="fa fa-star premium-hero-star"></i> ${this.t("stripeCheckoutTagline")}
				</p>
				<p class="premium-hero-subtext">${this.t("premiumCardWebText")}</p>
				<button @click="${()=>this.onStripeCheckout()}" class="w3-btn pc-secondary w3-margin-top">${this.t("premiumTrial")}</button>

				<div class="premium-divider premium-card-divider"><span>${this.t("premiumOr")}</span></div>

				<div class="premium-card-app">
					<span class="w3-tag w3-round w3-small premium-free-badge">${this.t("premiumFreeBadge")}</span>
					<p class="premium-card-app-title"><i class="fa fa-mobile"></i> ${this.t("premiumCardAppTitle")}</p>
					<ul class="premium-card-app-list">
						${["stripeCheckoutFeatureAllTariffsTitle", "stripeCheckoutFeatureWalletTitle", "stripeCheckoutFeatureOperatorFilterTitle"].map(key => html`
							<li><i class="fa fa-check"></i> ${this.t(key)}</li>
						`)}
					</ul>
					<div class="premium-app-badges">
						<a href="${this.iosLink}" target="_blank">
							<img src="img/store/app-store-badge.png" alt="Download on the App Store" class="premium-app-badge">
						</a>
						<a href="${this.playLink}" target="_blank">
							<img src="img/store/play-store-badge.png" alt="Get it on Google Play" class="premium-app-badge">
						</a>
					</div>
				</div>
			</div>
		</div>
		`;
	}

	emcAppPromoTemplate() {
		return html`
		<div class="w3-panel w3-pale-blue w3-leftbar w3-border-blue w3-margin-top" style="border-radius:6px;">
			<p><strong>Ladepreise.at als App am Smartphone</strong></p>
			<p>Noch mehr Features gefällig? Als EMC Mitglied kannst du auch die Chargeprice App nutzen. Lade die App herunter, melde dich mit deinem Konto an und profitiere von allen Premium-Features.</p>
			<div class="w3-margin-bottom">
				<a href="${this.iosLink}" target="_blank" style="text-decoration:none;">
					<img src="img/store/app-store-badge.png" alt="Download on the App Store" style="max-width:150px;height:auto;">
				</a>
				<a href="${this.playLink}" target="_blank" style="text-decoration:none;">
					<img src="img/store/play-store-badge.png" alt="Get it on Google Play" style="max-width:150px;height:auto;">
				</a>
			</div>
		</div>
		`;
	}

	accountNotActivatedEmcTemplate() {
		return html`
		<div class="w3-panel w3-pale-red w3-leftbar w3-border-red w3-margin-top" style="border-radius:6px;">
			<p><strong>Um Ladepreise.at voll zu nutzen, musst du deine EMC Mitgliedschaft bestätigen.</strong></p>
			<p>Wähle dafür "EMC Austria Mitgliedschaft" und gib deine Mitgliedsnummer und die Kartennummer ein. Beides findest du auf deiner EMC Mitgliedskarte.</p>
			<p><button @click="${()=>this.onActivateProducts()}" class="w3-btn pc-secondary">Jetzt EMC Mitgliedschaft bestätigen</button></p>
		</div>
		`;
	}

	accountNotActivatedTemplate() {
		if(this.themeLoader.getCurrentThemeId() === 'emc' && this.customConfig.paywallEnabled()) return this.accountNotActivatedEmcTemplate();
		return "";
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
		resetAppBanner();

		location.reload(true);
	}

	executeAction(entry){
		entry.action();
	}

	onActivateProducts() {
		new ModalActivateProducts(this.depts).show();
	}

	onStripeCheckout() {
		new ModalStripeCheckout(this.depts).show(this.profile, this.accessToken);
	}

	onGiveFeedback() {
		this.sidebar.feedback.other();
	}

	async render() {
		await this.loadProfileInfo();
		// Not logged in: the panel shows the login / sign up form (it used to be a popup)
		if (!this.accessToken) {
			new Authorization(this.depts).renderInline("userProfileContent");
			return;
		}
		render(this.template(), this.getEl("userProfileContent"));
	}
}
