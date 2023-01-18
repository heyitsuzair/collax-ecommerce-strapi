const SECRET_KEY = process.env.STRIPE_SK;
const stripe = require("stripe")(SECRET_KEY);

module.exports.payUsingStripe = async (
  card_no,
  card_cvc,
  expiry_month,
  expiry_year,
  totalAmount
) => {
  try {
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
      amount: totalAmount,
      currency: "pkr",
      source: token.id,
      description: "A Charge From Custom On Collax-Ecommerce-NextStrapi",
    });
    /**
     * !Charge Card ------------>
     */
    return { error: false, msg: charge };
  } catch (error) {
    return { error: true, msg: error.message };
  }
};
