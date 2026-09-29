import ModalStripeCheckout from '../modal/stripeCheckout';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class PremiumGate {
  constructor(depts, userSettings){
    this.depts = depts;
    this.themeLoader = depts.themeLoader();
    this.analytics = depts.analytics();
    this.userSettings = userSettings;
  }

  isPremium(){
    return !!(this.userSettings.isPro || this.userSettings.isMobilePremium);
  }

  // Premium features are only restricted on the default theme, never on white labels
  isRestricted(){
    return this.themeLoader.isDefaultTheme() && !this.isPremium();
  }

  // options.message: optional context shown at the top of the premium screen
  async showPremiumScreen(source, options = {}){
    this.analytics.log('event', 'premium_screen_opened', { source: source });

    let profile = null;
    let accessToken = null;
    try {
      const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();
      profile = tokenWithProfile.profile;
      accessToken = tokenWithProfile.accessToken;
    }
    catch(error){
      // Not logged in, the checkout asks to log in first
    }

    new ModalStripeCheckout(this.depts).show(profile, accessToken, options);
  }
}
