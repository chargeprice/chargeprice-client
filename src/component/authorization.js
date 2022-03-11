import { html, render } from "lit-html";
import ViewBase from "../component/viewBase";

import AuthService from "../repository/authorizationService";

export default class Authorization extends ViewBase {
	constructor(depts) {
		super(depts);
		this.root = "messageDialog";
		this.authService = new AuthService();

		this.validation = {
			email: new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
			password: new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])[a-zA-Z0-9]{8,16}$/),
			username: new RegExp(/^[a-zA-Z0-9]{6,}$/),
		};
		this.errorMessages = {
			email: '<p class="w3-text-red">Email not valid!</p>',
			username: '<p class="w3-text-red">Username should consists only from letters and numbers and must be at least 6 characters long!</p>',
			serviceUnavailable: '<p class="w3-text-red">Sorry, currently service is not available. Please try again later!</p>',
			passwordNotValid: '<p class="w3-text-red">Password must be at least 8-16 characters long and should contain at least one number, lowercase and uppercase letters only</p>',
		}
	}

	loginTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button @click="${()=>this.onCloseModal()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
						<img class="inverted" class="w3-button " src="img/close.svg">
					</button>
				</div>
				<div class="w3-container auth-modal-container">
					<div class="w3-section">
						<div class="w3-bar">
							<button
								id="sign_in_button"
								class="w3-bar-item w3-button w3-hover-none w3-border-white w3-bottombar w3-hover-border-blue w3-hover-text-blue w3-blue"
								@click="${() => this.onTabChange("sign_in")}"
							>
								Sign In
							</button>
							<button
								id="sign_up_button"
								class="w3-bar-item w3-button w3-hover-none w3-border-white w3-bottombar w3-hover-border-blue w3-hover-text-blue"
								@click="${() => this.onTabChange("sign_up")}"
							>
								Sign Up
							</button>
						</div>

						<form id="sign_in">
							<div>
								<label>Email:</label>
								<input type="text" name="sign_in_email" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>Password:</label>
								<input type="password" name="sign_in_password" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<button
								class="w3-button w3-block w3-blue w3-section w3-padding"
								type="submit"
								disabled
								@click="${(event) => this.onLogin(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>Login
							</button>
						</form>

						<form id="sign_up" style="display:none" @submit="return false;">
							<div>
								<label>Email:</label>
								<input type="text" name="sign_up_email" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>Password:</label>
								<input type="password" name="sign_up_password" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<div>
								<label>Username:</label>

								<input type="text" name="sign_up_username" class="w3-input w3-border w3-margin-bottom" />
							</div>
							<button
								class="w3-button w3-block w3-blue w3-section w3-padding"
								type="submit"
								disabled
								@click="${(event) => this.onRegister(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>Register
							</button>
						</form>

						<div id="error-list"></div>

						<span class="w3-right w3-padding w3-hide-small">Forgot <a @click="${() => this.onResetPasswordRequest()}" style="cursor: pointer;">password?</a></span>
					</div>
				</div>
			</div>
		`;
	}

	resetPasswordTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button @click="${()=>this.onCloseModal()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
						<img class="inverted" class="w3-button " src="img/close.svg">
					</button>
				</div>
				<div class="w3-container auth-modal-container">
					<div class="w3-section">
						<div class="w3-bar w3-margin-bottom">
							<i class="fa fa-lock"></i>
							<b>Trouble Logging In?</b>
						</div>
						<form id="reset_password">
							<label>Enter your email and we'll send you a link to get back into your account.</label>
							<input type="text" name="reset_password_email" class="w3-input w3-border w3-margin-bottom" />
							<button
								class="w3-button w3-block w3-blue w3-section w3-padding"
								type="submit"
								disabled
								@click="${(event) => this.onPasswordReset(event)}"
							>
								<i class="fa fa-refresh fa-spin"></i>Send link
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
					<button @click="${()=>this.onCloseModal()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
						<img class="inverted" class="w3-button " src="img/close.svg">
					</button>
				</div>
				<div class="w3-container">
					<div class="w3-section">
					</div>
				</div>
			</div>
		`;
	}

	successfulResetPasswordTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button @click="${()=>this.onCloseModal()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
						<img class="inverted" class="w3-button " src="img/close.svg">
					</button>
				</div>
				<div class="w3-container">
					<div class="w3-section">
						<label><b>Check your email please! Link with password reset instructions was sent to your email!</b></label>
					</div>
				</div>
			</div>
		`;
	}

	render() {
		render(this.loginTemplate(), document.getElementById(this.root));
		this.getEl(this.root).style.display = "block";

		document.getElementById('sign_in').addEventListener('change', (event) => this.validateLoginForm(event));
		document.getElementById('sign_up').addEventListener('change', (event) => this.validateRegistrationForm(event));

		document.getElementById('sign_in').addEventListener('submit', (event) => event.preventDefault());
		document.getElementById('sign_up').addEventListener('submit', (event) => event.preventDefault());
	}

	onResetPasswordRequest() {
		render(this.resetPasswordTemplate(), document.getElementById(this.root));

		document.getElementById('reset_password').addEventListener('change', (event) => this.validateResetPasswordForm(event));
		document.getElementById('reset_password').addEventListener('submit', (event) => event.preventDefault());
	}

	onTabChange(type) {
		const signIn = document.getElementById("sign_in");
		const signUp = document.getElementById("sign_up");

		const errorsContainer = document.getElementById("error-list");
		errorsContainer.innerHTML = "";

		if (type === "sign_in" && signIn.style.display === "none") {
			document.getElementById("sign_in").style.display = "block";
			document.getElementById("sign_up").style.display = "none";
			document.getElementById("sign_in_button").classList.toggle("w3-blue");
			document.getElementById("sign_up_button").classList.toggle("w3-blue");
		}

		if (type === "sign_up" && signUp.style.display === "none") {
			document.getElementById("sign_in").style.display = "none";
			document.getElementById("sign_up").style.display = "block";
			document.getElementById("sign_in_button").classList.toggle("w3-blue");
			document.getElementById("sign_up_button").classList.toggle("w3-blue");
		}
	}

	async onLogin(event) {
		const loginBtn = event.target;

		const errorsContainer = document.getElementById("error-list");
		const formData = {
			email: document.getElementsByName("sign_in_email")[0].value,
			password: document.getElementsByName("sign_in_password")[0].value,
		};

		// Toggle button loading state
		loginBtn.classList.toggle('loading');

		let result = null;

		try {
			result = await this.authService.signIn(formData);
			loginBtn.classList.toggle('loading');
		} catch (error) {
			loginBtn.classList.toggle('loading');
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
					errorsContainer.innerHTML = `<p class="w3-text-red">Sorry, your password was incorrect. Please check your password and try again.</p>`;

					if (error.message === "no_user_found") {
						errorsContainer.innerHTML = `<p class="w3-text-red">User not found. Please register first.</p>`;
					}

					if (error.message === "email_unconfirmed") {
						errorsContainer.innerHTML = `<p class="w3-text-red">Email not verified. Check your email box please, you should verify your email first!</p>`;
					}
				}
			}

			return;
		}
	}

	async onRegister(event) {
		const registerBtn = event.target;
		const errorsContainer = document.getElementById("error-list");
		const formData = {
			email: document.getElementsByName("sign_up_email")[0].value,
			password: document.getElementsByName("sign_up_password")[0].value,
			username: document.getElementsByName("sign_up_username")[0].value,
		};

		// Toggle button loading state
		registerBtn.classList.toggle('loading');

		let result = null;

		try {
			result = await this.authService.signUp(formData);
			registerBtn.classList.toggle('loading');
		} catch (error) {
			registerBtn.classList.toggle('loading');
			errorsContainer.innerHTML = this.errorMessages.serviceUnavailable;;
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

		this.getEl(this.root).style.display = "none";
	}

	async onPasswordReset(event) {
		const pwdResetBtn = event.target;
		const errorsContainer = document.getElementById("error-list");
		const email = document.getElementsByName('reset_password_email')[0].value;

		pwdResetBtn.classList.toggle('loading');

		if (email) {
			let result = null;

			try {
				result = await this.authService.requestPasswordChange({ email });
				pwdResetBtn.classList.toggle('loading');
			} catch (error) {
				pwdResetBtn.classList.toggle('loading');
				errorsContainer.innerHTML = this.errorMessages.serviceUnavailable;
				return;
			}

			if (result == null) {
				render(this.successfulResetPasswordTemplate(), document.getElementById(this.root));
			}
		}

	}

	saveAuthResult(data) {
		if (data.type !== "authentication_result") return;

		const { access_token, refresh_token } = data.attributes;

		localStorage.setItem("chrprice_access", access_token);
		localStorage.setItem("chrprice_refresh", refresh_token);

		this.onAuthorize(access_token);
	}

	onCloseModal() {
		this.getEl(this.root).style.display = "none";
	}

	validateLoginForm(event) {
		const errorsContainer = document.getElementById("error-list");
		const form = event.target.closest('form');
		const submitBtn = form.querySelector('button[type="submit"]')

		const inputEmail = form.querySelector('input[name="sign_in_email"]');
		const inputPassword = form.querySelector('input[name="sign_in_password"]');

		const isEmailValid = this.validation.email.exec(inputEmail.value);
		const isPasswordValid = this.validation.password.exec(inputPassword.value);

		errorsContainer.innerHTML = "";
		submitBtn.disabled = true;

		if (!isEmailValid) {
			!inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.email;
			return;
		} else {
			inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
		}

		if (!isPasswordValid) {
			!inputPassword.classList.contains('error') && inputPassword.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.passwordNotValid;
			return;
		} else {
			inputPassword.classList.contains('error') && inputPassword.classList.toggle('error');
		}

		if (isEmailValid && isPasswordValid) {
			submitBtn.disabled = false;
		}
	}
	validateRegistrationForm(event) {
		const errorsContainer = document.getElementById("error-list");
		const form = event.target.closest('form');
		const submitBtn = form.querySelector('button[type="submit"]')

		const inputEmail = form.querySelector('input[name="sign_up_email"]');
		const inputPassword = form.querySelector('input[name="sign_up_password"]');
		const inputUsername = form.querySelector('input[name="sign_up_username"]');

		const isEmailValid = this.validation.email.exec(inputEmail.value);
		const isPasswordValid = this.validation.password.exec(inputPassword.value);
		const isUsernameValid = this.validation.username.exec(inputUsername.value);

		errorsContainer.innerHTML = "";
		submitBtn.disabled = true;

		if (!isEmailValid) {
			!inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.email;
			return;
		} else {
			inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
		}

		if (!isPasswordValid) {
			!inputPassword.classList.contains('error') && inputPassword.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.passwordNotValid;
			return;
		} else {
			inputPassword.classList.contains('error') && inputPassword.classList.toggle('error');
		}

		if (!isUsernameValid) {
			!inputUsername.classList.contains('error') && inputUsername.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.username;
			return;
		} else {
			inputUsername.classList.contains('error') && inputUsername.classList.toggle('error');
		}

		if (isEmailValid && isPasswordValid && isUsernameValid) {
			submitBtn.disabled = false;
		}
	}
	validateResetPasswordForm(event) {
		const errorsContainer = document.getElementById("error-list");
		const form = event.target.closest('form');
		const submitBtn = form.querySelector('button[type="submit"]')

		const inputEmail = form.querySelector('input[name="reset_password_email"]');
		const isEmailValid = this.validation.email.exec(inputEmail.value);

		errorsContainer.innerHTML = "";
		submitBtn.disabled = true;

		if (!isEmailValid) {
			!inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
			errorsContainer.innerHTML = this.errorMessages.email;
			return;
		} else {
			inputEmail.classList.contains('error') && inputEmail.classList.toggle('error');
		}

		if (isEmailValid) {
			submitBtn.disabled = false;
		}
	}
}
