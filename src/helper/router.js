import Navigo from 'navigo';

export default class Router {
  constructor() {
    this.navigo = new Navigo("/");
  }

  on(routes) {
    this.navigo.on(routes);
    return this;
  }

  notFound(handler) {
    this.navigo.notFound(handler);
    return this;
  }

  navigate(path) {
    this.navigo.navigate(path);
  }

  resolve() {
    this.navigo.resolve();
  }
}
