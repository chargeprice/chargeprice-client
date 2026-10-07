import ModalStripeCheckout from '../modal/stripeCheckout';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';
import UrlModifier from '../helper/urlModifier';

// While the premium screen is open, the URL points to it, so it opens again
// after a login (page reload) or when coming back from the registration email
export const PREMIUM_PATH = "/map/premium";
const MAP_PATH = "/map";

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
  // options.checkoutResult: "success" or "cancelled" when coming back from the Stripe checkout
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

    new ModalStripeCheckout(this.depts).show(profile, accessToken, Object.assign({
      purchased: this.isPremium(),
      stripeManaged: !!this.userSettings.isStripeManaged
    }, options));
    new UrlModifier().setPath(PREMIUM_PATH);
  }

  static onPremiumScreenClosed(){
    if(window.location.pathname === PREMIUM_PATH) new UrlModifier().setPath(MAP_PATH);
  }
}
