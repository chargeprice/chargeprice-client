export default class AuthService {
	constructor() {
		this.baseEndpointUrl = process.env.CHARGEPRICE_AUTH_SERVICE;
		this.signInEndpoint = this.baseEndpointUrl + "/v1/authenticate";
		this.signUpEndpoint = this.baseEndpointUrl + "/v1/users";
		this.resetPasswordEndpoint = this.baseEndpointUrl + "/v1/trigger_reset_password";
	}

	async signIn(data) {
		try {
			const body = JSON.stringify({
				data: {
					type: "email_authentication",
					attributes: {
						email: data.email,
						password: data.password,
					},
				},
			});

			return await this.sendRequest({
				url: this.signInEndpoint,
				options: {
					method: "POST",
					body,
				},
			});
		} catch (error) {
			this.handleErrors(error);
		}
	}

	async signUp(data) {
		try {
			const body = JSON.stringify({
				data: {
					type: "user",
					attributes: {
						email: data.email,
						password: data.password,
						username: data.username,
						language: window.navigator.language.substring(0, 2),
					},
				},
			});

			return await this.sendRequest({
				url: this.signUpEndpoint,
				options: {
					method: "POST",
					body,
				},
			});
		} catch (error) {
			this.handleErrors(error);
		}
	}

	async requestPasswordChange(data) {
		try {
			const body = JSON.stringify({
				data: {
					type: "reset_password",
					attributes: {
						email: data.email,
					},
				},
			});

			return await this.sendRequest({
				url: this.resetPasswordEndpoint,
				options: {
					method: "POST",
					body,
				},
			});
		} catch (error) {
			this.handleErrors(error);
		}
	}

	async sendRequest(request) {
		return await fetch(request.url, {
			headers: {
				"Content-Type": "application/json",
			},
			...request.options,
		}).then((res) => {
			if (res.ok && res.status === 204) {
				return null;
			}

			return res.json();
		});
	}

	handleErrors(error) {
		// TODO: Need to proper error handling here
	}
}
