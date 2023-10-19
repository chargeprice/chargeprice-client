
import Translation from '../component/translation.js';
import CustomConfig from '../component/customConfig';
import Analytics from '../component/analytics'
import ThemeLoader from '../component/theme_loader'
import RepositorySettingsPrimitive from '../repository/settings/primitive'
import LocationIQ from '../repository/locationIQ';
import UrlModifier from '../helper/urlModifier';
import Currency from '../component/currency'
import EventBus from '../repository/eventBus'
import UserSettings from '../repository/userSettings'
import AuthService from '../repository/authorizationService'
import Vehicle from '../repository/vehicle'
import Tariff from '../repository/tariff'

export default class Dependencies {
  constructor(){
    this.translationInstance = new Translation();
    this.themeLoaderInstance = new ThemeLoader(this);
    this.customConfigInstance = null;
    this.userSettingsInstance = null;
    this.currencyInstance = new Currency(this);
    this.eventBusInstance = new EventBus();
  }

  static getInstance(){
    if(this.instance == null){
      this.instance = new Dependencies();
    }

    return this.instance;
  }

  settingsPrimitive(...args){
    return new RepositorySettingsPrimitive(this,...args);
  }

  analytics(){
    return new Analytics();
  }

  themeLoader(){
    return this.themeLoaderInstance;
  }

  translation(){
    return this.translationInstance;
  }

  customConfig(){
    if(this.customConfigInstance) return this.customConfigInstance;
    this.customConfigInstance = new CustomConfig(this);
    return this.customConfigInstance;
  }

  locationSearch(){
    return new LocationIQ(this);
  }

  urlModifier(){
    return new UrlModifier();
  }

  userSettings(){
    if(this.userSettingsInstance) return this.userSettingsInstance;
    this.userSettingsInstance = new UserSettings(this);
    return this.userSettingsInstance;
  }

  auth(){
    return new AuthService(this);
  }

  vehicle(){
    return new Vehicle(this);
  }

  tariff(){
    return new Tariff(this);
  }


  currency(){
    return this.currencyInstance;
  }

  eventBus(){
    return this.eventBusInstance;
  }
}


