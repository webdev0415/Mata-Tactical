var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;
var Constants = require("authorizenet").Constants;

import { ModelsList } from "../../libs/db";
const { ConsumerUser, TransactionList } = ModelsList;
import { promisify } from "util";
const util = require("util");
const {
  AUTHORIZE_PAYMENT_API_LOGIN_ID,
  AUTHORIZE_TRANSACTION_KEY,
} = process.env;

export const AuthorizePayment = async ({
  physical,
  webinar,
  user_id,
  totalAmount,
  customerProfileId,
  customerPaymentProfileId,
  transaction,
  transactionID,
  tax = 0,
  gift_card_price,
  promo_code_price,
}) => {
  try {
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(AUTHORIZE_PAYMENT_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(AUTHORIZE_TRANSACTION_KEY);

    const user = await ConsumerUser.findOne({ where: { id: user_id } });

    const profileToCharge = new ApiContracts.CustomerProfilePaymentType();
    profileToCharge.setCustomerProfileId(customerProfileId);

    const paymentProfile = new ApiContracts.PaymentProfile();
    paymentProfile.setPaymentProfileId(customerPaymentProfileId);
    profileToCharge.setPaymentProfile(paymentProfile);

    const orderDetails = new ApiContracts.OrderType();
    orderDetails.setInvoiceNumber(`INV-${transactionID}`);

    const billTo = new ApiContracts.CustomerAddressType();
    billTo.setFirstName(user.first_name);
    billTo.setLastName(user.last_name);
    billTo.setEmail(user.email);
    billTo.setAddress(user.street_address);
    billTo.setCity(user.city);
    billTo.setState(user.state);
    billTo.setZip(user.zipcode);
    billTo.setCountry("USA");
    const items = [];
    let counterId = 1;
    if (physical !== null) {
      physical.forEach((el) => {
        const lineItem = new ApiContracts.LineItemType();
        lineItem.setItemId(counterId);
        lineItem.setName(el.productName.substring(0, 20));
        lineItem.setDescription(el.shortDescription?.substring(0, 20) || "");
        lineItem.setQuantity(el.quantity);
        lineItem.setUnitPrice(el.pricePerItem);
        items.push(lineItem);
        counterId++;
      });
    }

    if (webinar !== null) {
      webinar.forEach((el) => {
        const lineItem = new ApiContracts.LineItemType();
        lineItem.setItemId(counterId);
        lineItem.setName(el.name.substring(0, 20));
        const description = `${el.shortDescription?.substring(
          0,
          20
        )} (Seat No: ${el.count.map(({ seatNo }) => seatNo + 1).sort()})`;
        console.log(description);
        lineItem.setDescription(description);
        lineItem.setQuantity(el.count.length);
        lineItem.setUnitPrice(el.price_per_seats);
        items.push(lineItem);
        counterId++;
      });
    }
    if (gift_card_price > 0) {
      const lineItem = new ApiContracts.LineItemType();
      lineItem.setItemId(counterId);
      lineItem.setName("Gift Card");
      lineItem.setDescription(`$${gift_card_price}`);
      lineItem.setQuantity(1);
      lineItem.setUnitPrice(0.0);
      items.push(lineItem);
      counterId++;
    }
    if (promo_code_price > 0) {
      const lineItem = new ApiContracts.LineItemType();
      lineItem.setItemId(counterId);
      lineItem.setName("Promo Code");
      lineItem.setDescription(`$${promo_code_price}`);
      lineItem.setQuantity(1);
      lineItem.setUnitPrice(0.0);
      items.push(lineItem);
      counterId++;
    }

    const lineItems = new ApiContracts.ArrayOfLineItem();
    lineItems.setLineItem(items);

    const taxSend = new ApiContracts.ExtendedAmountType();
    taxSend.setAmount(tax);
    taxSend.setName("Tax");
    taxSend.setDescription("Tax");

    const sendShipping = new ApiContracts.ExtendedAmountType();
    console.log("----total_amount --- ", totalAmount);
    sendShipping.setAmount(
      physical?.reduce((acc, el) => (acc += el.shipping_price), 0).toFixed(2) ||
        0
    );
    sendShipping.setName("Shipping");

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    // transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(totalAmount);
    transactionRequestType.setProfile(profileToCharge);
    transactionRequestType.setLineItems(lineItems);
    transactionRequestType.setOrder(orderDetails);
    transactionRequestType.setTax(taxSend);
    transactionRequestType.setShipping(sendShipping);
    // transactionRequestType.setBillTo(billTo);
    // transactionRequestType.setCustomer(customerInfo);

    const request = new ApiContracts.CreateTransactionRequest();
    request.setMerchantAuthentication(merchantAuthenticationType);
    request.setTransactionRequest(transactionRequestType);
    console.log(
      "JSON FOR REQUEST",
      util.inspect(request.getJSON(), { depth: null })
    );
    const ctrl = new ApiControllers.CreateTransactionController(
      request.getJSON()
    );

    //Defaults to sandbox
    console.log("-------staage---------", process.env.SERVICE_NAME);
    if (process.env.STAGE === "prod") {
      ctrl.setEnvironment(Constants.endpoint.production);
    }
    const exec = promisify(ctrl.execute.bind(ctrl));
    await exec();
    var apiResponse = ctrl.getResponse();

    var response = new ApiContracts.CreateTransactionResponse(apiResponse);
    console.log("response--------", response);
    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        if (response.getTransactionResponse().getMessages() != null) {
          await TransactionList.update(
            {
              status: "success",
              payment_id: response.getTransactionResponse().getTransId(),
            },
            { where: { id: transactionID }, transaction }
          );

          return {
            code: response.getTransactionResponse().getResponseCode(),
            messagecode: response
              .getTransactionResponse()
              .getMessages()
              .getMessage()[0]
              .getCode(),
            description: response
              .getTransactionResponse()
              .getMessages()
              .getMessage()[0]
              .getDescription(),
          };
        } else {
          console.log("Failed Transaction.");
          if (response.getTransactionResponse().getErrors() != null) {
            return {
              code: response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorCode(),
              message: response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorText(),
            };
          }
        }
      } else {
        if (
          response.getTransactionResponse() != null &&
          response.getTransactionResponse().getErrors() != null
        ) {
          return {
            code: response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorCode(),
            message: response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorText(),
          };
        } else {
          return {
            code: response.getMessages().getMessage()[0].getCode(),
            message: response.getMessages().getMessage()[0].getText(),
          };
        }
      }
    } else {
      console.log("Null Response.");
      return { message: "no response", code: -1 };
    }
  } catch (err) {
    // throw (err)
    return { message: err.message, code: -1 };
  }
};
