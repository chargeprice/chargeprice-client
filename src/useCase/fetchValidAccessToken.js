import { decodeToken } from '../helper/authorization';
import { NotLoggedInError, RefreshTokenExpired } from '../errors';

export default class FetchValidAccessToken {
  constructor(depts){
    this.depts=depts;
    this.authRepo = depts.auth();
    this.settingsRepo = depts.settingsPrimitive();
  }

  async run(){
    const tokens = this.settingsRepo.authTokens().get();

    if(!tokens) throw new NotLoggedInError();

    const accessToken = tokens.accessToken;
    if(this.accessTokenValid(accessToken)) return accessToken;

    return await this.refreshAccessToken(tokens);
  }

  accessTokenValid(accessToken){
    const { exp } = decodeToken(accessToken);
    return new Date(exp*1000) > new Date();
  }

  async refreshAccessToken(tokens){
    try {
      const result = await this.authRepo.refreshAccessToken(tokens.refreshToken);
      return this.processResult(result);
		} catch (error) {
      this.settingsRepo.authTokens().clear();
			throw new RefreshTokenExpired();
		}
  }

  processResult(result){
    const { access_token, refresh_token } = result.data.attributes;
    this.settingsRepo.authTokens().set({
			accessToken: access_token,
			refreshToken: refresh_token
    });
    
    return access_token;
  }
}