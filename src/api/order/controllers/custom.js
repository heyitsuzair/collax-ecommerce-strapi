const { createCoreController } = require("@strapi/strapi").factories;

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
              order_items,
            },
          }
        );
        ctx.body = {
          error: false,
          msg: "Order Added!",
        };
      } else if (method === "Stripe") {
      }
    } catch (err) {
      ctx.body = err;
    }
  },
}));
