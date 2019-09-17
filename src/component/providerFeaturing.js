export default class ProviderFeaturing {
  constructor() {
    this.featuredProviders = {
      "EMC": {
        backgroundColor: "#8fbf2233",
        logoUrl: "/themes/emc/logo.png"
      }
    }
  }
  
  getFeaturedProviders(){
    return this.featuredProviders;
  }
}