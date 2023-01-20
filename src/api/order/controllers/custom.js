const { createCoreController } = require("@strapi/strapi").factories;
const SECRET_KEY = process.env.STRIPE_SK;
const AN_LOGIN_KEY = process.env.AN_LOGIN_KEY;
const AN_TRANSACTION_KEY = process.env.AN_TRANSACTION_KEY;
const stripe = require("stripe")(SECRET_KEY);
var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;

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
          msg: "Order Placed!",
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
          msg: "Order Placed!",
        };
      } else {
        /**
         * @var merchantAuthenticationType Initialization
         */
        var merchantAuthenticationType =
          new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(AN_LOGIN_KEY);
        merchantAuthenticationType.setTransactionKey(AN_TRANSACTION_KEY);

        /**
         * @var creditCard Card Information
         */
        var creditCard = new ApiContracts.CreditCardType();
        creditCard.setCardNumber(card_no.toString());
        creditCard.setExpirationDate(
          expiry_month.toString() + expiry_year.toString()
        );
        creditCard.setCardCode(card_cvc.toString());

        var paymentType = new ApiContracts.PaymentType();
        paymentType.setCreditCard(creditCard);
        /**
         * @var billTo Information Of Customer (Not Necessary)
         */
        var billTo = new ApiContracts.CustomerAddressType();
        billTo.setFirstName(first_name);
        billTo.setLastName(last_name);
        billTo.setCompany(company);
        billTo.setAddress(street_address);
        billTo.setCity(city);
        billTo.setState(province);
        billTo.setZip(zip);
        billTo.setCountry(country);
        billTo.setEmail(email);
        billTo.setPhoneNumber(phone_no);
        /**
         * @var shipTo Information Of Customer (Not Necessary)
         */
        var shipTo = new ApiContracts.CustomerAddressType();
        shipTo.setFirstName(first_name);
        shipTo.setLastName(last_name);
        shipTo.setCompany(company);
        shipTo.setAddress(street_address);
        shipTo.setCity(city);
        shipTo.setState(province);
        shipTo.setZip(zip);
        shipTo.setCountry(country);

        /**
         * @var transactionRequestType Set Payment Info Including Ship To, Bill To, Total Amount And Payment Type
         */
        var transactionRequestType = new ApiContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(
          ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
        );
        transactionRequestType.setPayment(paymentType);
        transactionRequestType.setAmount(total);
        transactionRequestType.setBillTo(billTo);
        transactionRequestType.setShipTo(shipTo);

        /**
         * @var createRequest Create request
         */
        var createRequest = new ApiContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(merchantAuthenticationType);
        createRequest.setTransactionRequest(transactionRequestType);

        var ctrl = new ApiControllers.CreateTransactionController(
          createRequest.getJSON()
        );

        /**
         * @var execute Execute Request
         */
        const execute = new Promise((resolve, reject) => {
          ctrl.execute(() => {
            var apiResponse = ctrl.getResponse();

            let response = new ApiContracts.CreateTransactionResponse(
              apiResponse
            );
            if (response != null) {
              if (
                response.getMessages().getResultCode() ==
                ApiContracts.MessageTypeEnum.OK
              ) {
                if (response.getTransactionResponse().getMessages() != null) {
                  resolve(response.getTransactionResponse());
                } else {
                  if (response.getTransactionResponse().getErrors() != null) {
                    reject({
                      error: true,
                      msg: response
                        .getTransactionResponse()
                        .getErrors()
                        .getError()[0]
                        .getErrorText(),
                    });
                  }
                }
              } else {
                if (
                  response.getTransactionResponse() != null &&
                  response.getTransactionResponse().getErrors() != null
                ) {
                  reject({
                    error: true,
                    msg: response
                      .getTransactionResponse()
                      .getErrors()
                      .getError()[0]
                      .getErrorText(),
                  });
                } else {
                  reject({
                    error: true,
                    msg: response.getMessages().getMessage()[0].getText(),
                  });
                }
              }
            } else {
              console.log("Null Response.");
            }
          });
        });
        /**
         * Execute the request
         */
        await execute
          .then(async (value) => {
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
                    transaction_id: value.transId,
                    receipt: "Not Available On Authorize.net",
                    paid: true,
                  },
                },
              }
            );
            ctx.body = {
              error: false,
              msg: "Order Placed!",
            };
          })
          .catch((err) => (ctx.body = { error: true, msg: err.msg }));
      }
    } catch (err) {
      ctx.body = { error: true, msg: err.message };
    }
  },
}));
