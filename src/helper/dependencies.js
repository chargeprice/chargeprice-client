
import Translation from '../component/translation.js';
import CustomConfig from '../component/customConfig';
import Analytics from '../component/analytics'
import ThemeLoader from '../component/theme_loader'
import RepositorySettingsPrimitive from '../repository/settings/primitive'
import LocationIQ from '../repository/locationIQ';
import UrlModifier from '../helper/urlModifier';

export default class Dependencies {

  constructor(){
    this.translationInstance = new Translation();
    this.customConfigInstance = new CustomConfig();
  }

  settingsPrimitive(...args){
    return new RepositorySettingsPrimitive(this,...args);
  }

  analytics(){
    return new Analytics();
  }

  themeLoader(){
    return new ThemeLoader(this.translation());
  }

  translation(){
    return this.translationInstance;
  }

  customConfig(){
    return this.customConfigInstance;
  }

  locationSearch(){
    return new LocationIQ();
  }

  urlModifier(){
    return new UrlModifier();
  }
}


