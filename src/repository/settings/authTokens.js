export default class RepositoryAuthTokens {

  constructor(settingsRepo){
    this.key = "authTokens";
    this.settingsRepo = settingsRepo;
  }

  set(value){
    if(!value.accessToken || !value.refreshToken){
      throw new Exception("invalid auth token format");
    } 

    this.settingsRepo.setObject(this.key, value);
  }

  get(){
    return this.settingsRepo.getObject(this.key);
  }  

  clear(){
    this.settingsRepo.clear(this.key);
  }
}

