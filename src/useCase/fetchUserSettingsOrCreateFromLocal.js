import { NotFound, NotLoggedInError } from "../errors";
import { v4 as uuidv4 } from 'uuid';

export default class FetchUserSettingsOrCreateFromLocal {
  constructor(depts){
    this.depts=depts;
    this.userSettingsRepo = depts.userSettings();
    this.settingsRepo = depts.settingsPrimitive();
    this.defaultVehicleId = "7de25a64-e9fa-484f-bf99-d02b02cfb17d";
  }

  async run(){
    const settings = await this.loadSettings();
    settings.isPro = settings.meta.products.includes("web_pro");
    return settings;
  }

  async loadSettings(){
    try {
      return await this.userSettingsRepo.show();
    }
    catch(ex){
      if(ex instanceof NotFound){
        const model = this.buildUserSettingsFromLocal();
        return await this.userSettingsRepo.upsert(model);
      }
      else if(ex instanceof NotLoggedInError){
        return this.buildUserSettingsFromLocal();
      }
      else throw ex;
    }
  }

  buildUserSettingsFromLocal(){
    return {
      data: {
        id: uuidv4(),
        type: "user_settings",
        version: 1,
        vehicle: this.loadLocalVehicle(),
        tariffs: this.loadLocalTariffs()
      },
      meta: { products: [] }
    }
  }

  loadLocalTariffs(){
    return this.settingsRepo.getObject("myTariffIds", []).map(id=>{ return {id: id, type: "tariff" } }) 
  }

  loadLocalVehicle(){
    return this.settingsRepo.getObject("myVehicle", { id: this.defaultVehicleId, type: "car" });
  }
}