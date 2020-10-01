var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;
var Constants = require("authorizenet").Constants;

import connectToDatabase from "../../libs/db";
import { promisify } from "util";

const {
  AUTHORIZE_PAYMENT_API_LOGIN_ID,
  AUTHORIZE_TRANSACTION_KEY,
} = process.env;

export const main = async (event) => {
  console.log("event", event);
  try {
    const requestBody = event;
    const {
      ConsumerUser,
      PhysicalProduct,
      WebinarProduct,
      TransactionList,
    } = await connectToDatabase();
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(AUTHORIZE_PAYMENT_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(AUTHORIZE_TRANSACTION_KEY);
    const user = await ConsumerUser.findOne({
      where: { id: requestBody.user_id },
    });
    let productDetail = {};
    let totalAmount = 0;

    if (requestBody.product_type === "product") {
      const physicalProduct = await PhysicalProduct.findOne({
        where: { id: requestBody.productID },
      });
      productDetail.id = physicalProduct.id;
      productDetail.product_name = physicalProduct.productName;
      productDetail.product_type = "Purchase Physical Product";
      productDetail.unitPrice = physicalProduct.pricePerItem;
      productDetail.units_amount = 1;
      totalAmount =
        totalAmount + productDetail.unitPrice * productDetail.units_amount;
    } else if (requestBody.product_type === "webinar") {
      const webinar_product = await WebinarProduct.findOne({
        where: { id: requestBody.productID },
      });

      productDetail.id = webinar_product.id;
      productDetail.product_name = webinar_product.name;
      productDetail.product_type = "Purchase Webinar Seats";
      productDetail.unitPrice = webinar_product.price_per_seats;
      productDetail.units_amount = requestBody.seats_count;
      totalAmount =
        totalAmount + productDetail.unitPrice * productDetail.units_amount;
    }
    const newTransactionList = await TransactionList.create({
      product_type: requestBody.product_type,
      product_id: requestBody.productID,
      user_id: requestBody.user_id,
      amount: totalAmount,
      units: productDetail.units_amount,
    });

    const opaqueData = new ApiContracts.OpaqueDataType();
    opaqueData.setDataDescriptor(requestBody.opaqueData.dataDescriptor);
    opaqueData.setDataValue(requestBody.opaqueData.dataValue);

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setOpaqueData(opaqueData);

    const orderDetails = new ApiContracts.OrderType();
    orderDetails.setInvoiceNumber(`INV-${newTransactionList.id}`);
    orderDetails.setDescription(productDetail.product_type);

    const billTo = new ApiContracts.CustomerAddressType();
    billTo.setFirstName(user.first_name);
    billTo.setLastName(user.last_name);
    billTo.setEmail(user.email);
    billTo.setAddress(user.street_address);
    billTo.setCity(user.city);
    billTo.setState(user.state);
    billTo.setZip(user.zipcode);
    billTo.setCountry("USA");
    const customerInfo = new ApiContracts.CustomerDataType();
    customerInfo.setEmail(user.email);

    const lineItem = new ApiContracts.LineItemType();
    lineItem.setItemId(productDetail.product_type.toUpperCase());
    lineItem.setName(productDetail.product_type.toUpperCase());
    lineItem.setDescription(productDetail.product_name);
    lineItem.setQuantity(productDetail.units_amount.toString());
    lineItem.setUnitPrice(productDetail.unitPrice.toString());

    const lineItems = new ApiContracts.ArrayOfLineItem();
    lineItems.setLineItem([lineItem]);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(totalAmount.toString());
    transactionRequestType.setLineItems(lineItems);
    transactionRequestType.setOrder(orderDetails);
    transactionRequestType.setBillTo(billTo);
    transactionRequestType.setCustomer(customerInfo);

    const request = new ApiContracts.CreateTransactionRequest();
    request.setMerchantAuthentication(merchantAuthenticationType);
    request.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(
      request.getJSON()
    );
    console.log('----------stage name-----',process.env.STAGE);
    //Defaults to sandbox
    if (process.env.STAGE === "prod") {
      ctrl.setEnvironment(Constants.endpoint.production);
      console.log('----------stage name-----',process.env.STAGE);
    }
    const exec = promisify(ctrl.execute.bind(ctrl));
    await exec();
    var apiResponse = ctrl.getResponse();

    var response = new ApiContracts.CreateTransactionResponse(apiResponse);

    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        if (response.getTransactionResponse().getMessages() != null) {
          await TransactionList.update(
            { status: "success" },
            { where: { id: newTransactionList.id } }
          );

          return {
            transactionID: response.getTransactionResponse().getTransId(),
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
    return { message: err.message, code: -1 };
  }
};
