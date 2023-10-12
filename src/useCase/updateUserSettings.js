import { VersionConflict, NotLoggedInError } from "../errors";
import FetchUserSettingsOrCreateFromLocal from './fetchUserSettingsOrCreateFromLocal.js';


export default class UpdateUserSettings {
  constructor(depts){
    this.depts=depts;
    this.userSettingsRepo = depts.userSettings();
    this.settingsRepo = depts.settingsPrimitive();
  }

  async run(changedAttributes){
    const currentModel = (await new FetchUserSettingsOrCreateFromLocal(this.depts).run()).data;
        
    const model = this.duplicateModel(currentModel);

    let dirty = false;
    for(const key in changedAttributes){
      if(!this.jsonEqual(model[key], changedAttributes[key])) dirty = true;
      model[key] = changedAttributes[key];
    }

    if(!dirty){
      return currentModel;
    } 

    model.version++;

    try {
      return await this.userSettingsRepo.upsert(model);
    }
    catch(ex){
      if(ex instanceof VersionConflict){
        this.userSettingsRepo.clearCache();
        return this.run(changedAttributes);
      }
      else if(ex instanceof NotLoggedInError){
        return this.updateLocalStorage(model);
      }
      else throw ex;
    }
  }

  updateLocalStorage(model){
    this.settingsRepo.setObject("myTariffIds", model.tariffs.map(t=>t.id));
    this.settingsRepo.setObject("myVehicle", model.vehicle)

    return model;
  }

  duplicateModel(model){
    return JSON.parse(JSON.stringify(model));
  }

  jsonEqual(a, b){
    return JSON.stringify(a) == JSON.stringify(b); 
  }
}