import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class UserProducts {
  constructor(depts) {
    this.depts = depts;
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async activate(source) {
    const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();

    const url = `${this.base_url}/v1/users/${tokenWithProfile.profile.userId}/products`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
        "Authorization": `Bearer ${tokenWithProfile.accessToken}`
      },
      body: JSON.stringify({
        data: {
          type: "user_products",
          attributes: {
            source: source
          }
        }
      })
    });

    if (response.status === 201) return;

    const body = await response.json();
    const code = body.errors && body.errors[0] && body.errors[0].code;

    if (response.status === 404 && code === "PRODUCT_SOURCE_NOT_FOUND") {
      throw { code: "PRODUCT_SOURCE_NOT_FOUND" };
    }
    if (response.status === 409 && code === "PRODUCT_SOURCE_ALREADY_USED") {
      throw { code: "PRODUCT_SOURCE_ALREADY_USED" };
    }
    throw { code: "GENERIC_ERROR" };
  }
}
