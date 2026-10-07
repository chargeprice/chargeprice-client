import ModalStripeCheckout from '../modal/stripeCheckout';
import ModalPaywallEmc from '../modal/paywall_emc';
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
    this.customConfig = depts.customConfig();
    this.analytics = depts.analytics();
    this.userSettings = userSettings;
  }

  isPremium(){
    return !!(this.userSettings.isPro || this.userSettings.isMobilePremium);
  }

  // Premium features are restricted on the default theme and, with the paywall enabled, for EMC
  // (unlocked by the EMC membership). Never on other white labels.
  isRestricted(){
    if(this.isPremium()) return false;
    return this.themeLoader.isDefaultTheme() || this.isEmcPaywall();
  }

  isEmcPaywall(){
    return this.themeLoader.getCurrentThemeId() === 'emc' && this.customConfig.paywallEnabled();
  }

  // Chargeprice's own upsells (ads, Chargeprice app banners, Stripe) only on the default theme
  showsUpsells(){
    return this.themeLoader.isDefaultTheme() && !this.isPremium();
  }

  // options.message: optional context shown at the top of the premium screen
  // options.checkoutResult: "success" or "cancelled" when coming back from the Stripe checkout
  async showPremiumScreen(source, options = {}){
    this.analytics.log('event', 'premium_screen_opened', { source: source });

    // EMC unlocks the premium features with its membership, not with Chargeprice Premium
    if(this.isEmcPaywall()){
      new ModalPaywallEmc(this.depts).show(await this.isLoggedIn());
      return;
    }

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

  async isLoggedIn(){
    try {
      await new FetchAccessTokenWithProfile(this.depts).run();
      return true;
    }
    catch(error){
      return false;
    }
  }

  static onPremiumScreenClosed(){
    if(window.location.pathname === PREMIUM_PATH) new UrlModifier().setPath(MAP_PATH);
  }
}
