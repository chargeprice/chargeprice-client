import { html, render } from 'lit-html';

import ViewBase from './viewBase';

import { decodeToken } from '../helper/authorization';

export default class UserProfile extends ViewBase {
  constructor(sidebar,depts) {
		super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.profile = {};
  }

  template(){
    return html`
      <div class="w3-container w3-margin-top">
				<div class="w3-container w3-center">
					<i class="fa fa-user" style="font-size: 4rem; color: #777;"></i>
				</div>
				<p><b>${this.t('authLabelEmail')}:</b> ${this.profile.email}</p>
				<p><b>${this.t('authLabelUsername')}:</b> ${this.profile.username}</p>
      </div>
      <div class="w3-container w3-center">
				<button class="w3-btn pc-secondary w3-margin-top" @click="${() => this.onLogout()}">Logout</button>
      </div>
    `;
  }

  getProfile(){
    return this.profile;
  }

	getProfileInfo() {
		try {
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

	onLogout() {
		localStorage.removeItem('chrprice_access');
		localStorage.removeItem('chrprice_refresh');

		this.hide('sidebar');
		this.getEl('auth-options').classList.toggle('hidden');
		this.getEl('auth-profile').classList.toggle('hidden');
	}

	render() {
		this.getProfileInfo();
		render(this.template(), this.getEl('userProfileContent'));
	}
}
