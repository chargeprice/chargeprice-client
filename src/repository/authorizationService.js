export default class AuthService {
	constructor() {
		this.baseEndpointUrl = process.env.CHARGEPRICE_AUTH_SERVICE;
		this.signInEndpoint = this.baseEndpointUrl + "/v1/authenticate";
		this.signUpEndpoint = this.baseEndpointUrl + "/v1/users";
		this.resetPasswordEndpoint = this.baseEndpointUrl + "/v1/trigger_reset_password";
		this.apiKey = process.env.CHARGEPRICE_API_KEY;
	}

	async signIn(data) {
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
	}

	async refreshAccessToken(refreshToken){
		const body = JSON.stringify({
			data: {
				type: "refresh_token_authentication",
				attributes: {
					refresh_token: refreshToken
				}
			}
		});

		return await this.sendRequest({
			url: this.signInEndpoint,
			options: {
				method: "POST",
				body,
			},
		});
	}

	async signUp(data) {
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
	}

	async requestPasswordChange(data) {
		const body = JSON.stringify({
			data: {
				type: "trigger_reset_password",
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
	}

	async deleteAccount(userId, accessToken){
		await fetch(
			`${this.baseEndpointUrl}/v1/users/${userId}`, 
			{
			headers: {
				"API-Key": this.apiKey,
				"Authorization": `Bearer ${accessToken}`
			},
			method: "DELETE"
		})
	}

	async sendRequest(request) {
		return await fetch(request.url, {
			headers: {
				"Content-Type": "application/json",
				"Api-Key": this.apiKey
			},
			...request.options,
		}).then((res) => {
			if (res.ok && res.status === 204) {
				return null;
			}

			return res.json();
		});
	}
}
