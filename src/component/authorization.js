import { html, render } from "lit-html";
import ViewBase from "../component/viewBase";
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import AuthService from "../repository/authorizationService";

export default class Authorization extends ViewBase {
	constructor(depts) {
		super(depts);
		this.root = "messageDialog";
		this.settingsRepo = depts.settingsPrimitive();
		this.authService = new AuthService();

		this.validation = {
			email: new RegExp(/^[\w-+_\.]+@([\w-]+\.)+[\w-]{2,}$/),
			password: new RegExp(/^.{8,64}$/),
			username: new RegExp(/^\w+(\s\w+)*$/),
		};
		this.errorMessages = {
			email: `<p class="w3-text-red">${this.t("authEmailValidationError")}</p>`,
			username: `<p class="w3-text-red">${this.t("authUsernameValidationError")}</p>`,
			serviceUnavailable: `<p class="w3-text-red">${this.t("authServiceNotAvailable")}</p>`,
			passwordNotValid: `<p class="w3-text-red">${this.t("authPasswordValidationError")}</p>`,
		};
	}

	loginTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button
						@click="${() => this.onCloseModal()}"
						class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close"
					>
						<img class="inverted" class="w3-button " src="img/close.svg" />
					</button>
					<div class="w3-rest w3-large popup-header">${this.t("authModalHeader")}</div>
				</div>
				<div class="w3-container auth-modal-container">
					<div class="w3-section">
						<div class="w3-bar">
							<button
								id="sign_in_button"
								class="w3-bar-item w3-button pc-main"
								@click="${() => this.onTabChange("sign_in")}"
							>
								${this.t("authLogInTabLabel")}
							</button>
							<button
								id="sign_up_button"
								class="w3-bar-item w3-button"
								@click="${() => this.onTabChange("sign_up")}"
							>
								${this.t("authSignUpTabLabel")}
							</button>
						</div>

						<form id="sign_in" @submit="return false;">
							<div>
								<label>${this.t("authLabelEmail")}:</label>
								<input type="text" name="sign_in_email" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>${this.t("authLabelPassword")}:</label>
								<input type="password" name="sign_in_password" class="w3-input w3-border" />
							</div>
							<label class="link-text" @click="${() => this.onResetPasswordRequest()}">
									${this.t("authForgotPasswordLink")}
							</label>
							<button
								class="w3-button w3-block pc-main w3-section w3-padding"
								type="submit"
								@click="${(event) => this.onLogin(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>${this.t("authLogInBtnText")}
							</button>
						</form>

						<form id="sign_up" style="display:none" @submit="return false;">
							<div>
								<label>${this.t("authLabelUsername")}:</label>
								<input type="text" name="sign_up_username" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>${this.t("authLabelEmail")}:</label>
								<input type="text" name="sign_up_email" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>${this.t("authLabelPassword")}:</label>
								<input type="password" name="sign_up_password" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<input @change="${(event) => this.validateRegistrationForm(event)}" type="checkbox" id="sign_up_policy_agreement" name="sign_up_policy_agreement" class="w3-margin-bottom" />
								<label for="sign_up_policy_agreement">${unsafeHTML(this.t("authLabelPrivatePolicy"))}</label>
							</div>
							<button
								class="w3-button w3-block pc-main w3-section w3-padding"
								type="submit"
								disabled
								@click="${(event) => this.onRegister(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>${this.t("authSignUpBtnText")}
							</button>
						</form>

						<div id="error-list"></div>

						<div>${unsafeHTML(this.t("accountBenefits"))}</div>
					</div>
				</div>
			</div>
		`;
	}

	resetPasswordTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button
						@click="${() => this.onCloseModal()}"
						class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close"
					>
						<img class="inverted" class="w3-button " src="img/close.svg" />
					</button>
				</div>
				<div class="w3-container auth-modal-container">
					<div class="w3-section">
						<div class="w3-bar w3-margin-bottom">
							<i class="fa fa-lock"></i>
							<b>${this.t("authForgotPasswordModalHeader")}</b>
						</div>
						<form id="reset_password">
							<label>${this.t("authLabelForgotPassword")}</label>
							<input type="text" name="reset_password_email" class="w3-input w3-border w3-margin-bottom" />
							<button
								class="w3-button w3-block pc-main w3-section w3-padding"
								type="submit"
								disabled
								@click="${(event) => this.onPasswordReset(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>${this.t("authForgotPasswordBtnText")}
							</button>

							<div id="error-list"></div>
						</form>
					</div>
				</div>
			</div>
		`;
	}

	successfulRegistrationTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button
						@click="${() => render(this.loginTemplate(), this.getEl(this.root))}"
						class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close"
					>
						<img class="inverted" class="w3-button" src="img/close.svg" />
					</button>
				</div>
				<div class="w3-container">
					<div class="w3-section">${this.t("authSignUpSuccessfulText")}</div>
				</div>
			</div>
		`;
	}

	successfulResetPasswordTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button
						@click="${() => this.onCloseModal()}"
						class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close"
					>
						<img class="inverted" class="w3-button " src="img/close.svg" />
					</button>
				</div>
				<div class="w3-container">
					<div class="w3-section">
						<label>${this.t("authForgotPasswordSuccessfulText")}</label>
					</div>
				</div>
			</div>
		`;
	}

	render() {
		render(this.loginTemplate(), this.getEl(this.root));
		this.getEl(this.root).style.display = "block";

		this.getEl("sign_in").addEventListener("keyup", (event) => this.validateLoginForm(event));
		this.getEl("sign_up").addEventListener("keyup", (event) => this.validateRegistrationForm(event));

		this.getEl("sign_in").addEventListener("submit", (event) => event.preventDefault());
		this.getEl("sign_up").addEventListener("submit", (event) => event.preventDefault());
	}

	onResetPasswordRequest() {
		render(this.resetPasswordTemplate(), this.getEl(this.root));

		this.getEl("reset_password")
			.addEventListener("keyup", (event) => this.validateResetPasswordForm(event));
		this.getEl("reset_password").addEventListener("submit", (event) => event.preventDefault());
	}

	onTabChange(type) {
		const signIn = this.getEl("sign_in");
		const signUp = this.getEl("sign_up");

		const errorsContainer = this.getEl("error-list");
		errorsContainer.innerHTML = "";

		if (type === "sign_in" && signIn.style.display === "none") {
			this.getEl("sign_in").style.display = "block";
			this.getEl("sign_up").style.display = "none";
			this.getEl("sign_in_button").classList.toggle("pc-main");
			this.getEl("sign_up_button").classList.toggle("pc-main");
		}

		if (type === "sign_up" && signUp.style.display === "none") {
			this.getEl("sign_in").style.display = "none";
			this.getEl("sign_up").style.display = "block";
			this.getEl("sign_in_button").classList.toggle("pc-main");
			this.getEl("sign_up_button").classList.toggle("pc-main");
		}
	}

	async onLogin(event) {
		const loginBtn = event.target;

		const errorsContainer = this.getEl("error-list");
		const formData = {
			email: document.getElementsByName("sign_in_email")[0].value,
			password: document.getElementsByName("sign_in_password")[0].value,
		};

		// Toggle button loading state
		loginBtn.classList.toggle("loading");

		let result = null;

		try {
			result = await this.authService.signIn(formData);
			loginBtn.classList.toggle("loading");
		} catch (error) {
			loginBtn.classList.toggle("loading");
			errorsContainer.innerHTML = this.errorMessages.serviceUnavailable;
			return;
		}

		errorsContainer.innerHTML = "";

		// After successful login save access_token and refresh_token to local storage.
		if (result.data) {
			this.getEl(this.root).style.display = "none";
			this.saveAuthResult(result.data);
		}

		// TODO: Next code should be placed into global error handling
		if (result.errors) {
			for (let error of result.errors) {
				if (error.status && error.status === 400) {
					errorsContainer.innerHTML = `<p class="w3-text-red">${error.message}</p>`;
				}

				if (error.status && error.status === 401) {
					errorsContainer.innerHTML = `<p class="w3-text-red">${this.t('authPasswordWrong')}</p>`;

					if (error.message === "no_user_found") {
						errorsContainer.innerHTML = `<p class="w3-text-red">${this.t('authLoginUserNotFound')}</p>`;
					}

					if (error.message === "email_unconfirmed") {
						errorsContainer.innerHTML = `<p class="w3-text-red">${this.t('authEmailNotVerified')}</p>`;
					}
				}
			}

			return;
		}
	}

	async onRegister(event) {
		const registerBtn = event.target;
		const errorsContainer = this.getEl("error-list");
		const formData = {
			email: document.getElementsByName("sign_up_email")[0].value,
			password: document.getElementsByName("sign_up_password")[0].value,
			username: document.getElementsByName("sign_up_username")[0].value,
		};

		// Toggle button loading state
		registerBtn.classList.toggle("loading");

		let result = null;

		try {
			result = await this.authService.signUp(formData);
			registerBtn.classList.toggle("loading");
		} catch (error) {
			registerBtn.classList.toggle("loading");
			errorsContainer.innerHTML = this.errorMessages.serviceUnavailable;
			return;
		}

		errorsContainer.innerHTML = "";

		// TODO: Next code should be placed into global error handling
		if (result && result.errors) {
			for (let error of result.errors) {
				errorsContainer.innerHTML = `<p class="w3-text-red">${error.message}</p>`;
			}

			return;
		}

		render(this.successfulRegistrationTemplate(), this.getEl(this.root));
	}

	async onPasswordReset(event) {
		const pwdResetBtn = event.target;
		const errorsContainer = this.getEl("error-list");
		const email = document.getElementsByName("reset_password_email")[0].value;

		pwdResetBtn.classList.toggle("loading");

		if (email) {
			let result = null;

			try {
				result = await this.authService.requestPasswordChange({ email });
				pwdResetBtn.classList.toggle("loading");
			} catch (error) {
				pwdResetBtn.classList.toggle("loading");
				errorsContainer.innerHTML = this.errorMessages.serviceUnavailable;
				return;
			}

			if (result && result.errors) {
				for (let error of result.errors) {
					errorsContainer.innerHTML = `<p class="w3-text-red">${error.message}</p>`;
				}

				return;
			}

			if (result == null) {
				render(this.successfulResetPasswordTemplate(), this.getEl(this.root));
			}
		}
	}

	async saveAuthResult(data) {
		if (data.type !== "authentication_result") return;

		const { access_token, refresh_token } = data.attributes;

		this.settingsRepo.authTokens().set({
			accessToken: access_token,
			refreshToken: refresh_token
		});

		location.reload(true);
	}

	onCloseModal() {
		this.getEl(this.root).style.display = "none";
	}

	validateLoginForm(event) {
		const errorsContainer = this.getEl("error-list");
		// const form = event.target.closest("form");
		// const submitBtn = form.querySelector('button[type="submit"]');

		// const inputEmail = form.querySelector('input[name="sign_in_email"]');
		// const inputPassword = form.querySelector('input[name="sign_in_password"]');

		// const isEmailValid = this.validation.email.exec(inputEmail.value);
		// const isPasswordValid = this.validation.password.exec(inputPassword.value);

		errorsContainer.innerHTML = "";
		// submitBtn.disabled = true;

		// if (!isEmailValid) {
		// 	!inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
		// 	errorsContainer.innerHTML = this.errorMessages.email;
		// 	return;
		// } else {
		// 	inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
		// }

		// if (!isPasswordValid) {
		// 	!inputPassword.classList.contains("error") && inputPassword.classList.toggle("error");
		// 	errorsContainer.innerHTML = this.errorMessages.passwordNotValid;
		// 	return;
		// } else {
		// 	inputPassword.classList.contains("error") && inputPassword.classList.toggle("error");
		// }

		// if (isEmailValid && isPasswordValid) {
		// 	submitBtn.disabled = false;
		// }
	}
	validateRegistrationForm(event) {
		const errorsContainer = this.getEl("error-list");
		const form = event.target.closest("form");
		const submitBtn = form.querySelector('button[type="submit"]');

		const inputEmail = form.querySelector('input[name="sign_up_email"]');
		const inputPassword = form.querySelector('input[name="sign_up_password"]');
		const inputUsername = form.querySelector('input[name="sign_up_username"]');
		const inputPrivacyPolicy = form.querySelector('input[name="sign_up_policy_agreement"]');

		const isEmailValid = this.validation.email.exec(inputEmail.value);
		const isPasswordValid = this.validation.password.exec(inputPassword.value);
		const isUsernameValid = this.validation.username.exec(inputUsername.value);
		const isPrivacyPolicyChecked = inputPrivacyPolicy.checked;

		errorsContainer.innerHTML = "";
		submitBtn.disabled = true;

		if (!isEmailValid) {
			!inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
			errorsContainer.innerHTML = this.errorMessages.email;
			return;
		} else {
			inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
		}

		if (!isPasswordValid) {
			!inputPassword.classList.contains("error") && inputPassword.classList.toggle("error");
			errorsContainer.innerHTML = this.errorMessages.passwordNotValid;
			return;
		} else {
			inputPassword.classList.contains("error") && inputPassword.classList.toggle("error");
		}

		if (!isUsernameValid) {
			!inputUsername.classList.contains("error") && inputUsername.classList.toggle("error");
			errorsContainer.innerHTML = this.errorMessages.username;
			return;
		} else {
			inputUsername.classList.contains("error") && inputUsername.classList.toggle("error");
		}

		if (isEmailValid && isPasswordValid && isUsernameValid && isPrivacyPolicyChecked) {
			submitBtn.disabled = false;
		}
	}
	validateResetPasswordForm(event) {
		const errorsContainer = this.getEl("error-list");
		const form = event.target.closest("form");
		const submitBtn = form.querySelector('button[type="submit"]');

		const inputEmail = form.querySelector('input[name="reset_password_email"]');
		// const isEmailValid = this.validation.email.exec(inputEmail.value);

		errorsContainer.innerHTML = "";
		submitBtn.disabled = true;

		// if (!isEmailValid) {
		// 	!inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
		// 	errorsContainer.innerHTML = this.errorMessages.email;
		// 	return;
		// } else {
		// 	inputEmail.classList.contains("error") && inputEmail.classList.toggle("error");
		// }

		if (inputEmail.value) {
			submitBtn.disabled = false;
		}
	}
}
