import { html, render } from "lit-html";
import ViewBase from "../component/viewBase";

import AuthService from "../repository/authorizationService";

export default class Authorization extends ViewBase {
	constructor(depts) {
		super(depts);
		this.root = "messageDialog";
		this.authService = new AuthService();
	}

	loginTemplate() {
		return html`
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-row w3-bar pc-secondary">
					<button @click="${()=>this.onCloseModal()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
						<img class="inverted" class="w3-button " src="img/close.svg">
					</button>
				</div>
				<div class="w3-container">
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

						<div id="sign_in">
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
								@click="${() => this.onLogin()}"
							>
								Login
							</button>
						</div>

						<div id="sign_up" style="display:none">
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
								@click="${() => this.onRegister()}"
							>
								Register
							</button>
						</div>

						<div id="error-list"></div>

						<span class="w3-right w3-padding w3-hide-small">Forgot <a @click="${() => this.onResetPasswordRequest()}">password?</a></span>
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
				<div class="w3-container">
					<div class="w3-section">
						<div class="w3-bar w3-margin-bottom">
							<i class="fa fa-lock"></i>
							<b>Trouble Logging In?</b>
						</div>
						<div>
							<label>Enter your email and we'll send you a link to get back into your account.</label>
							<input type="text" name="reset_password_email" class="w3-input w3-border w3-margin-bottom" />
							<button
							class="w3-button w3-block w3-blue w3-section w3-padding"
								type="submit"
								@click="${() => this.onPasswordReset()}"
							>
								Send link
							</button>
						</div>
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
	}

	onResetPasswordRequest() {
		render(this.resetPasswordTemplate(), document.getElementById(this.root));
	}

	onTabChange(type) {
		const signIn = document.getElementById("sign_in");
		const signUp = document.getElementById("sign_up");

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

	async onLogin() {
		const errorsContainer = document.getElementById("error-list");
		const formData = {
			email: document.getElementsByName("sign_in_email")[0].value,
			password: document.getElementsByName("sign_in_password")[0].value,
		};

		const result = await this.authService.signIn(formData);

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
				}
			}

			return;
		}
	}

	async onRegister() {
		const errorsContainer = document.getElementById("error-list");
		const formData = {
			email: document.getElementsByName("sign_up_email")[0].value,
			password: document.getElementsByName("sign_up_password")[0].value,
			username: document.getElementsByName("sign_up_username")[0].value,
		};

		const result = await this.authService.signUp(formData);

		errorsContainer.innerHTML = "";

		// TODO: Next code should be placed into global error handling
		if (result.errors) {
			for (let error of result.errors) {
				// if (error.status && error.status === 400) {
				//     errorsContainer.innerHTML = `<p class="w3-text-red">${error.message}</p>`;
				// }
				// if (error.status && error.status === 401) {
				//     errorsContainer.innerHTML = `<p class="w3-text-red">Sorry, your password was incorrect. Please check your password and try again.</p>`;
				//     if (error.message === 'no_user_found') {
				//         errorsContainer.innerHTML = `<p class="w3-text-red">User not found. Please register first.</p>`;
				//     }
				// }
			}

			return;
		}

		this.getEl(this.root).style.display = "none";
	}

	async onPasswordReset() {
		const email = document.getElementsByName('reset_password_email')[0].value;

		if (email) {
			const result = await this.authService.requestPasswordChange({ email });

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
}
