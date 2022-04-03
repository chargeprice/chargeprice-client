import { decodeToken } from '../helper/authorization';
import FetchValidAccessToken from './fetchValidAccessToken';


export default class FetchAccessTokenWithProfile {
  constructor(depts){
    this.depts=depts;
  }

  async run(){
    const accessToken = await new FetchValidAccessToken(this.depts).run();

    const { email, sub, exp, username } = decodeToken(accessToken);

    return {
      accessToken: accessToken,
      profile: {
        email: email,
        userId: sub,
        expiresAt: new Date(exp),
        username: username
      }
    }
  }
}