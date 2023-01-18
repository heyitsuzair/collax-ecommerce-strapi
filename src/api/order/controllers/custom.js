const { createCoreController } = require("@strapi/strapi").factories;
const SECRET_KEY = process.env.STRIPE_SK;
const stripe = require("stripe")(SECRET_KEY);

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  // Method 1: Creating an entirely custom action
  async placeOrder(ctx) {
    try {
      const {
        country,
        first_name,
        last_name,
        company,
        street_address,
        apartment_no,
        city,
        province,
        zip,
        email,
        phone_no,
        method,
        card_no,
        card_cvc,
        expiry_year,
        expiry_month,
        total,
        order_items,
      } = ctx.request.body;

      if (method === "COD") {
        const add_order = await strapi.entityService.create(
          "api::order.order",
          {
            data: {
              country,
              first_name,
              last_name,
              company,
              street_address,
              apartment_no,
              city,
              province,
              zip,
              email,
              phone_no,
              method,
              total,
              order_items,
            },
          }
        );
        ctx.body = {
          error: false,
          msg: "Order Added!",
        };
      } else if (method === "Stripe") {
        /**
         * ?Validate Card And Generate Token ------------>
         */

        const token = await stripe.tokens.create({
          card: {
            number: card_no,
            exp_month: expiry_month,
            exp_year: expiry_year,
            cvc: card_cvc,
          },
        });
        /**
         * !Validate Card And Generate Token ------------>
         */

        /**
         * ?Charge Card ------------>
         */

        const charge = await stripe.charges.create({
          amount: total * 100,
          currency: "USD",
          source: token.id,
          description: "A Charge From Custom On Collax-Ecommerce-NextStrapi",
        });
        /**
         * !Charge Card ------------>
         */

        const add_order = await strapi.entityService.create(
          "api::order.order",
          {
            data: {
              country,
              first_name,
              last_name,
              company,
              street_address,
              apartment_no,
              city,
              province,
              zip,
              email,
              phone_no,
              method,
              total,
              order_items,
              transaction_info: {
                transaction_id: charge.id,
                receipt: charge.receipt_url,
                paid: charge.paid,
              },
            },
          }
        );
        ctx.body = {
          error: false,
          msg: "Order Added!",
        };
      }
    } catch (err) {
      ctx.body = { error: true, msg: err.message };
    }
  },
}));
