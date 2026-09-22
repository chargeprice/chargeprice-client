export default class Stripe {
  constructor(depts) {
    this.depts = depts;
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async createPortalSession(userId, accessToken, returnUrl) {
    const url = `${this.base_url}/v1/users/${userId}/stripe/portal`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        data: {
          type: "stripe_portal_session",
          attributes: {
            return_url: returnUrl
          }
        }
      })
    });

    if (response.status === 201) {
      const body = await response.json();
      return body.data.attributes.url;
    }

    const body = await response.json();
    const code = body.errors && body.errors[0] && body.errors[0].code;

    if (response.status === 404 && code === "STRIPE_CUSTOMER_NOT_FOUND") {
      throw { code: "STRIPE_CUSTOMER_NOT_FOUND" };
    }
    throw { code: "GENERIC_ERROR" };
  }

  async createCheckoutSession(userId, accessToken, product, billingCycle) {
    const url = `${this.base_url}/v1/users/${userId}/stripe/checkout`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        data: {
          type: "stripe_checkout_session",
          attributes: {
            product: product,
            billing_cycle: billingCycle
          }
        }
      })
    });

    if (response.status === 201) {
      const body = await response.json();
      return body.data.attributes.url;
    }

    const body = await response.json();
    const code = body.errors && body.errors[0] && body.errors[0].code;

    if (response.status === 404 && code === "PRICE_NOT_FOUND") {
      throw { code: "PRICE_NOT_FOUND" };
    }
    throw { code: "GENERIC_ERROR" };
  }
}
