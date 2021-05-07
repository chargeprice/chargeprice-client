export default class ProviderFeaturing {
  constructor() {
    this.featuredProviders = {
      "a480edbe-d673-4faa-ad70-5d22273d15a0": {
        backgroundColor: "#8fbf2233",
        logoUrl: "/themes/emc/logo.png"
      },
      "e91ecf83-f9d8-4219-90a6-1efdb2a808bd": {
        backgroundColor: "#f6fff6",
        logoUrl: "/img/emps/elvah_small.png"
      },
      "9ae2932b-fc90-4491-b494-f028c1c25c43": {
        backgroundColor: "#f6fff6",
        logoUrl: "/img/emps/elvah_small.png"
      },
      "ecd72e29-dbdd-4dc2-8778-75f2f78b4d56": {
        backgroundColor: "#b6dcf3",
        logoUrl: "/img/emps/freshmile_long.png"
      },
    }
  }
  
  getFeaturedProviders(){
    return this.featuredProviders;
  }
}