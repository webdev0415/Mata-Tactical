import moment from "moment";
import { Op, Sequelize } from "sequelize";
import { ModelsList } from "../../libs/db";
import { AuthorizePayment } from "./payment";
import ProductService from "../products";
import NotificationAdminServices from "../NotificationAdminServices";
import PromoCodeService from "../promoCode";
import TextService from "../textService";
// import AWS from "aws-sdk";
import { promisify } from "util";
var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;
var Constants = require("authorizenet").Constants;
const {
  WebinarProductDetail,
  PhysicalProduct,
  PromoCode,
  sequelize,
  TransactionList,
  ProductImageList,
  WebinarProduct,
  ConsumerUser,
  GiftCard,
  PurchaseHistory,
} = ModelsList;

const {
  AUTHORIZE_PAYMENT_API_LOGIN_ID,
  AUTHORIZE_TRANSACTION_KEY,
} = process.env;

export default class Checkout {
  static async pay(req) {
    const transaction = await sequelize.transaction();
    try {
      const { body } = req;
      console.log("body", body);
      const user_id = req.requestContext.authorizer.sub;

      const physical_req = body.products.filter(
        (product) => product.product_type === "physical"
      );
      const webinar_req = body.products.filter(
        (product) => product.product_type === "webinar"
      );

      if (!physical_req.length && !webinar_req.length)
        throw new Error("Send Product");

      let physicalDB = null;
      if (physical_req.length > 0) {
        const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
        const items = await PhysicalProduct.scope(...scope).findAll({
          where: {
            id: {
              [Op.in]: physical_req.map(({ id }) => id),
            },
          },
          raw: true,
          nest: true,
        });

        if (items.length !== physical_req.length) {
          throw new Error("Some products are not found");
        }
        const physical_req_obj = physical_req.reduce(
          (acc, el) => ({ [el.id]: el, ...acc }),
          {}
        );

        const expired_items = items.filter(
          (el) => el.amount < physical_req_obj[el.id].amount
        );
        if (expired_items.length > 0) {
          const expired_names = expired_items.map((el) => el.productName);
          throw new Error(`${expired_names} is no longer available`);
        }
        physicalDB = items.map((item) => ({
          quantity: physical_req_obj[item.id].amount,
          ...item,
        }));
      }

      let webinarDB = null;
      let webinarDB_seats = null;
      if (webinar_req.length > 0) {
        const result = await WebinarProductDetail.findAll({
          where: {
            webinar_id: {
              [Op.in]: webinar_req.map((el) => el.id),
            },
            seat_status: "reserved",
            reserved_time: {
              [Op.lt]: moment().subtract(5, "minutes").toDate(),
            },
            user_id,
          },
          raw: true,
        });
        await WebinarProductDetail.destroy({
          where: {
            webinar_id: {
              [Op.in]: webinar_req.map((el) => el.id),
            },
            seat_status: "reserved",
            reserved_time: {
              [Op.lt]: moment().subtract(5, "minutes").toDate(),
            },
          },
        });
        if (result.length > 0) {
          throw new Error("Some of the webinar products are expired");
        }
        webinarDB_seats = await WebinarProductDetail.findAll({
          where: {
            user_id,
            seat_status: "reserved",
            webinar_id: { [Op.in]: webinar_req.map((el) => el.id) },
          },
          raw: true,
        });

        const temp_webinarSeats = webinar_req.map((el) => el.id);
        if (!webinarDB_seats.length) {
          throw new Error("Has any webinar not reserved");
        }
        if (
          !webinarDB_seats.every((el) =>
            temp_webinarSeats.includes(el.webinar_id)
          )
        ) {
          throw new Error("Has any webinar not reserved");
        }

        const scope = [{ method: ["withPrimaryImage", ProductImageList] }];

        webinarDB = await WebinarProduct.scope(...scope).findAll({
          where: {
            id: webinarDB_seats.map((el) => el.webinar_id),
          },
          raw: true,
          nest: true,
        });

        webinarDB = webinarDB.map((el) => {
          return {
            ...el,
            count: webinarDB_seats.filter((seat) => el.id === seat.webinar_id),
          };
        });
      }

      let promoCodeID = null;

      if (body.promoCode) {
        const promoCode = await PromoCode.findOne({
          where: {
            id: body.promoCode,
          },
        });

        if (
          !promoCode ||
          !promoCode.number_used ||
          (promoCode.user_id && promoCode.user_id !== user_id)
        ) {
          throw new Error("The promo code cannot be applied to this checkout");
        }

        if (promoCode.date_from && promoCode.date_to) {
          const isValid = moment().isBetween(
            moment(promoCode.date_from),
            moment(promoCode.date_to)
          );
          if (!isValid) {
            throw new Error("You cannot use this promo code now.");
          }
        }
        --promoCode.number_used;
        promoCodeID = promoCode.id;
        await promoCode.save({ transaction });

        switch (promoCode.product_type) {
          case "physical":
            if (!(physicalDB || []).length) {
              throw new Error("This promo code must be used in physical");
            }

            if (!promoCode.product_id) {
              physicalDB = physicalDB.map((el) => ({
                ...el,
                sale: {
                  amount: promoCode.amount,
                  type: promoCode.code_type,
                },
              }));
            } else {
              const physical_promoCode = physicalDB.find(
                (el) => el.id === promoCode.product_id
              );
              if (!physical_promoCode) {
                throw new Error(
                  "You are trying to use a promotional code that is not intended for these products"
                );
              }

              physical_promoCode.sale = {
                amount: promoCode.amount,
                type: promoCode.code_type,
              };
            }
            break;
          case "webinar":
            if (webinarDB_seats !== null && webinarDB_seats.length === 0) {
              throw new Error("This promo code must be used in webinar");
            }

            if (!promoCode.product_id) {
              webinarDB = webinarDB.map((el) => {
                return {
                  ...el,
                  sale: {
                    amount: promoCode.amount,
                    type: promoCode.code_type,
                  },
                };
              });
            } else {
              const webinar_promoCode = webinarDB.find(
                (el) => el.id === promoCode.product_id
              );
              if (!webinar_promoCode) {
                throw new Error(
                  "You are trying to use a promotional code that is not intended for these products"
                );
              }
              webinar_promoCode.sale = {
                amount: promoCode.amount,
                type: promoCode.code_type,
              };
            }
            break;
        }
      }
      const userInfo = await ConsumerUser.findOne({
        where: {
          id: user_id,
        },
        attributes: [
          "first_name",
          "last_name",
          "phone_number",
          "email",
          "address",
          "street_address",
          "zipcode",
          "city",
          "state",
        ],
        raw: true,
      });
      let promo_code_price = 0;
      const total_webinar =
        webinarDB?.reduce((acc, el) => {
          let temp_total = el.price_per_seats * el.count.length;
          // if (!el.sale) return (acc += temp_total);
          switch (el.sale?.type) {
            case "percent":
              const percent = (temp_total * el.sale.amount) / 100;
              temp_total -= percent;
              promo_code_price += percent;
              break;
            case "seat":
              temp_total -= el.price_per_seats;
              promo_code_price += el.price_per_seats;
              break;
            case "cost":
              temp_total -= el.sale.amount / webinarDB.length;
              promo_code_price += el.sale.amount / webinarDB.length;
              break;
          }
          return (acc += temp_total);
        }, 0) || 0;
      let tax = 0.0;
      const total_physical =
        physicalDB?.reduce((acc, el) => {
          let temp_total = el.pricePerItem * el.quantity;
          if (
            process.env.TEXAS_TAX_ENABLE &&
            process.env.TEXAS_TAX_ENABLE == "true" &&
            (userInfo.state?.toLowerCase().includes("texas") ||
              userInfo.state?.toLowerCase().includes("tx")) &&
            el.taxable
          ) {
            tax += (temp_total > 0 ? temp_total * 0.0825 : 0).toFixed(2);
          }
          switch (el.sale?.type) {
            case "percent":
              const percent = (temp_total * el.sale.amount) / 100;
              temp_total -= percent;
              promo_code_price += percent;
              break;
            case "cost":
              temp_total -= el.sale.amount / physicalDB.length;
              promo_code_price += el.sale.amount / physicalDB.length;
              break;
          }

          return (acc += temp_total);
        }, 0) || 0;

      const total_shipping_price =
        physicalDB?.reduce((acc, el) => (acc += el.shipping_price), 0) || 0;

      let allGiftCards = null;
      let currentBalanceGiftCard = null;

      if (body.giftCard) {
        allGiftCards = await GiftCard.findAll({ where: { user_id } });
        currentBalanceGiftCard = allGiftCards.reduce(
          (acc, el) => (acc += el.status === "unused" ? el.amount : -el.amount),
          0
        );
        if (body.giftCard > currentBalanceGiftCard) {
          throw new Error("Your balance is less than what you want to use");
        }
      }
      console.log("Tax_---price", tax);
      const totalAmount = +(
        Math.max(total_webinar + total_physical - (+body.giftCard || 0), 0) +
        total_shipping_price +
        parseFloat(tax)
      ).toFixed(2);
      console.log("total_shipping_price", total_shipping_price);
      console.log("totalAmount", totalAmount);
      console.log("tax_price", tax);
      let gift_card_price = body.giftCard || 0;
      let transactionRecord = null;

      // Todo create payment profile, get credential
      const transactionDB = await TransactionList.create(
        {
          user_id,
          amount: totalAmount,
          // status: "success",
          promo_code_id: promoCodeID,
          gift_card_amount: +body.giftCard || null,
        },
        {
          transaction,
        }
      );
      const payment_profile = await Checkout.createPaymentProfile({
        id: transactionDB.id,
        opaqueData: body.opaqueData,
        ...userInfo,
      });
      transactionDB.consumer_profile_id = payment_profile.consumer_profile_id;
      transactionDB.payment_profile_id = `${payment_profile.payment_profile_id}`;

      await transactionDB.save({ transaction });

      // return { result: payment_profile };

      if (totalAmount > 0) {
        const paymentProcess = await AuthorizePayment({
          physical: physicalDB,
          webinar: webinarDB,
          totalAmount,
          gift_card_price,
          promo_code_price,
          user_id,
          customerProfileId: payment_profile.consumer_profile_id,
          customerPaymentProfileId: payment_profile.payment_profile_id,
          transaction,
          transactionID: transactionDB.id,
          tax,
        });
        console.log(paymentProcess);
        if (paymentProcess.code != 1) throw paymentProcess;
      } else {
      }
      // transactionRecord = paymentProcess.transactionID;
      transactionRecord = transactionDB.id;

      if (body.giftCard) {
        await GiftCard.create(
          {
            status: "used",
            user_id,
            transaction_id: transactionRecord,
            amount: +body.giftCard || null,
          },
          { transaction }
        );
      }

      if (webinarDB?.length) {
        const promises = webinarDB.map(async (el) => {
          const temp_web = await WebinarProduct.findOne({
            where: { id: el.id },
          });
          await WebinarProduct.update(
            {
              remainingSeats: Sequelize.literal(
                `remainingSeats - ${el?.count?.length}`
              ),
            },
            { where: { id: el.id }, transaction }
          );
          const remainingSeats = temp_web.remainingSeats - el?.count?.length;
          console.log("old", el?.remainingSeats);
          console.log("new", remainingSeats);
          console.log(
            "taken_seats",
            webinarDB_seats?.filter((seat_el) => seat_el.webinar_id === el.id)
              .length
          );
          console.log("el seats", el?.count?.length);
          if (remainingSeats < 1) {
            await WebinarProduct.update(
              {
                product_status: "soldout",
                soldout_date: moment().toISOString(),
              },
              { where: { id: el.id }, transaction }
            );
            console.log("----------webinar---", el);
            await NotificationAdminServices.addNotify({
              product_type: "webinar",
              product_name: el.name,
              service_type: "sold_out",
              product_image: el.main_image
                ? el.main_image.image_url
                  ? el.main_image.image_url
                  : ""
                : "",
            });
            await NotificationAdminServices.sendEmails({
              product_type: "webinar",
              product_name: el.name,
              service_type: "sold_out",
            });

            await PromoCodeService.checkUsingCode(el.id);
          }
          await TextService.createSubscription({
            id: user_id,
            webinar_id: el.id,
            method: "webinar",
          });
          if (el.publish_method === "queued") {
            await ProductService.releaseQueue();
          }
          return;
        });
        await Promise.all(promises);
        await WebinarProductDetail.bulkCreate(
          webinarDB_seats.map((el) => ({ id: el.id, seat_status: "taken" })),
          {
            transaction,
            updateOnDuplicate: ["seat_status"],
            ignoreDuplicates: true,
          }
        );

        await PurchaseHistory.bulkCreate(
          webinarDB_seats.map((el) => ({
            orderStatus: "Purchased",
            userID: user_id,
            orderNo: transactionRecord,
            shipping_address: userInfo.address,
            state: userInfo.state,
            street_address: userInfo.street_address,
            city: userInfo.city,
            zipcode: userInfo.zipcode,
            product_type: "webinar",
            productID: el.webinar_id,
            seatsNo: el.seatNo,
            price: webinarDB.find((webinar) => webinar.id === el.webinar_id)
              .price_per_seats,
          })),
          { transaction }
        );
      }

      if (physicalDB?.length) {
        await Promise.all(
          physicalDB.map(async (el) => {
            const physicalUpdate = { amount: el.amount - el.quantity };
            if (physicalUpdate.amount === 0) {
              physicalUpdate.product_status = "hold";
              physicalUpdate.publish_method = "instant";
            }
            await PhysicalProduct.update(physicalUpdate, {
              where: { id: el.id },
              transaction,
            });
            if (el.amount - el.quantity < 1) {
              await NotificationAdminServices.sendEmails({
                product_type: "physical",
                product_name: el.productName,
                service_type: "sold_out",
              });
              console.log("-------physical--------", el);
              await NotificationAdminServices.addNotify({
                product_type: "physical",
                product_name: el.productName,
                service_type: "sold_out",
                product_image: el.main_image
                  ? el.main_image.image_url
                    ? el.main_image.image_url
                    : ""
                  : "",
              });
            }
            let price = 0;
            let tax_price = 0;
            const temp_total = el.pricePerItem * el.quantity;

            if (!el.sale) {
              price += temp_total;
            } else {
              switch (el.sale.type) {
                case "percent":
                  const percent = (temp_total * el.sale.amount) / 100;
                  price += temp_total - percent;
                  break;
                case "cost":
                  price += Math.max(temp_total - el.sale.amount, 0);
                  break;
              }
            }
            if (
              process.env.TEXAS_TAX_ENABLE &&
              process.env.TEXAS_TAX_ENABLE == "true" &&
              (userInfo.state?.toLowerCase().includes("texas") ||
                userInfo.state?.toLowerCase().includes("tx")) &&
              el.taxable
            ) {
              tax_price = price > 0 ? price * 0.0825 : 0;
            }
            price += el.shipping_price;
            price += tax_price;
            return await PurchaseHistory.create(
              {
                orderStatus: "Purchased",
                orderNo: transactionRecord,
                userID: user_id,
                product_type: "product",
                productID: el.id,
                price,
                units: el.quantity,
                tax: tax_price,
                shipping_price: el.shipping_price,
                shipping_address: userInfo.address,
                state: userInfo.state,
                city: userInfo.city,
                zipcode: userInfo.zipcode,
                street_address: userInfo.street_address,
              },
              { transaction }
            );
          })
        );
      }

      await transaction.commit();
      return {
        result: { message: "success" },
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async Refund({ body }) {
    const scope = [
      { method: ["withTransaction", TransactionList] },
      { method: ["withBuyer", ConsumerUser] },
    ];
    const seatsArray = await PurchaseHistory.scope(...scope).findAll({
      where: {
        seatsNo: body.seatsNo,
        productID: body.webinar_id,
        orderStatus: "Purchased",
      },
    });
    if (seatsArray.length < 1) {
      throw new Error("No Data Found");
    }
    const transaction_id_lists = seatsArray.map(
      (seat) => seat.transaction_detail.payment_id
    );
    const distinct_transaction_lists = transaction_id_lists.filter(
      (value, index, self) => self.indexOf(value) === index
    );
    const promises = distinct_transaction_lists.map(async (payment_id) => {
      const seatsData = await seatsArray.filter(
        (seat) => seat.transaction_detail.payment_id === payment_id
      );
      var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
      merchantAuthenticationType.setName(
        process.env.AUTHORIZE_PAYMENT_API_LOGIN_ID
      );
      merchantAuthenticationType.setTransactionKey(
        process.env.AUTHORIZE_TRANSACTION_KEY
      );
      var getRequest = new ApiContracts.GetTransactionDetailsRequest();
      getRequest.setMerchantAuthentication(merchantAuthenticationType);
      getRequest.setTransId(payment_id);

      console.log(JSON.stringify(getRequest.getJSON(), null, 2));
      const seats = seatsData.map((seat) => seat.seatsNo);
      var ctrl = new ApiControllers.GetTransactionDetailsController(
        getRequest.getJSON()
      );
      console.log(seatsData);
      console.log("--------", process.env.SERVICE_NAME);
      if (process.env.STAGE === "prod") {
        ctrl.setEnvironment(Constants.endpoint.production);
      }
      const exec = promisify(ctrl.execute.bind(ctrl));
      await exec();
      var apiResponse = await ctrl.getResponse();
      console.log(apiResponse);
      if (apiResponse != null) {
        if (apiResponse.transaction.responseCode == 1) {
        } else {
          return {
            status: "failed",
            payment_id,
            user_name: seatsData[0].buyer.username,
            seats_id: seats,
          };
        }
      } else {
        return {
          status: "failed",
          payment_id,
          user_name: seatsData[0].buyer.username,
          seats_id: seats,
        };
      }

      var creditCard = new ApiContracts.CreditCardType();
      creditCard.setCardNumber(
        apiResponse.transaction.payment.creditCard.cardNumber
      );
      creditCard.setExpirationDate(
        apiResponse.transaction.payment.creditCard.expirationDate
      );

      var paymentType = new ApiContracts.PaymentType();
      paymentType.setCreditCard(creditCard);

      var transactionRequestType = new ApiContracts.TransactionRequestType();
      transactionRequestType.setTransactionType(
        ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION
      );
      transactionRequestType.setPayment(paymentType);
      transactionRequestType.setAmount(seatsData[0].price * seatsData.length);
      transactionRequestType.setRefTransId(payment_id);
      var createRequest = new ApiContracts.CreateTransactionRequest();
      createRequest.setMerchantAuthentication(merchantAuthenticationType);
      createRequest.setTransactionRequest(transactionRequestType);
      var ctrl1 = new ApiControllers.CreateTransactionController(
        createRequest.getJSON()
      );

      const exec1 = promisify(ctrl1.execute.bind(ctrl1));
      await exec1();
      var response = ctrl1.getResponse();
      if (response != null) {
        if (response.messages.resultCode == ApiContracts.MessageTypeEnum.OK) {
          if (response.messages != null) {
            await WebinarProductDetail.destroy({
              where: {
                seatNo: seatsData.map((seat) => seat.seatsNo),
                webinar_id: body.webinar_id,
              },
            });
            await PurchaseHistory.update(
              { orderStatus: "Refund" },
              { where: { seatsNo: seats, productID: body.webinar_id } }
            );
            return {
              status: "success",
              payment_id,
              user_name: seatsData[0].buyer.username,
              seats_id: seats,
            };
          } else {
            return {
              status: "failed",
              payment_id,
              user_name: seatsData[0].buyer.username,
              seats_id: seats,
            };
          }
        } else {
          return {
            status: "failed",
            payment_id,
            user_name: seatsData[0].buyer.username,
            seats_id: seats,
          };
        }
      } else {
        return {
          status: "failed",
          payment_id,
          user_name: seatsData[0].buyer.username,
          seats_id: seats,
        };
      }
    });
    const responseList = await Promise.all(promises);
    return { result: { response: responseList } };
  }

  static async createPaymentProfile({
    opaqueData,
    email,
    id,
    first_name,
    last_name,
    phone_number,
    street_address,
    state,
    zipcode,
    city,
  }) {
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(AUTHORIZE_PAYMENT_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(AUTHORIZE_TRANSACTION_KEY);

    const opaque = new ApiContracts.OpaqueDataType();
    opaque.setDataDescriptor(opaqueData.dataDescriptor);
    opaque.setDataValue(opaqueData.dataValue);

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setOpaqueData(opaque);

    const customerAddress = new ApiContracts.CustomerAddressType();
    customerAddress.setFirstName(first_name);
    customerAddress.setLastName(last_name);
    customerAddress.setPhoneNumber(phone_number);
    customerAddress.setAddress(street_address);
    customerAddress.setCity(city);
    customerAddress.setState(state);
    customerAddress.setZip(zipcode);
    customerAddress.setCountry("USA");
    const customerPaymentProfileType = new ApiContracts.CustomerPaymentProfileType();
    customerPaymentProfileType.setCustomerType(
      ApiContracts.CustomerTypeEnum.INDIVIDUAL
    );
    customerPaymentProfileType.setPayment(paymentType);
    customerPaymentProfileType.setBillTo(customerAddress);

    const paymentProfilesList = [];
    paymentProfilesList.push(customerPaymentProfileType);

    const customerProfileType = new ApiContracts.CustomerProfileType();
    customerProfileType.setMerchantCustomerId(id);
    customerProfileType.setEmail(email);
    customerProfileType.setPaymentProfiles(paymentProfilesList);

    const createRequest = new ApiContracts.CreateCustomerProfileRequest();
    createRequest.setProfile(customerProfileType);
    // createRequest.setValidationMode(ApiContracts.ValidationModeEnum.TESTMODE);
    createRequest.setMerchantAuthentication(merchantAuthenticationType);

    //pretty print request

    const ctrl = new ApiControllers.CreateCustomerProfileController(
      createRequest.getJSON()
    );
    console.log("-------staage---------", process.env.SERVICE_NAME);
    if (process.env.STAGE === "prod") {
      ctrl.setEnvironment(Constants.endpoint.production);
    }
    const exec = await promisify(ctrl.execute.bind(ctrl));
    await exec();

    const apiResponse = ctrl.getResponse();
    console.log(apiResponse);
    const response = new ApiContracts.CreateCustomerProfileResponse(
      apiResponse
    );

    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        const consumer_profile_id = response.getCustomerProfileId();
        const payment_id =
          response.customerPaymentProfileIdList.numericString[0];
        return {
          consumer_profile_id,
          payment_profile_id: JSON.parse(payment_id),
        };
      } else {
        throw new Error(
          "Error create payment profile" +
            response.getMessages().getMessage()[0].getText()
        );
      }
    } else {
      throw new Error("Null response received");
    }
  }

  static async refoundWithProfile({
    body: { seats, webinar_id, paymentMethod = "payment" },
  }) {
    const transaction = await sequelize.transaction();
    try {
      const scope = [{ method: ["withTransaction", TransactionList] }];
      const purchases = await PurchaseHistory.scope(...scope).findAndCountAll({
        where: {
          productID: webinar_id,
          seatsNo: seats,
          orderStatus: "Purchased",
        },
        group: ["orderNo"],
      });
      if (!purchases?.rows.length) {
        throw new Error("Nothing to refound");
      }
      const result = purchases.count.map((purchase) => {
        const { price, transaction_detail, userID } = purchases.rows.find(
          (el) => el.orderNo === purchase.orderNo
        );

        return {
          price,
          userID,
          transaction_detail,
          ...purchase,
        };
      });
      console.log("paymentMethod", paymentMethod);
      switch (paymentMethod) {
        case "gift":
          console.log("Refund gifts");
          await GiftCard.bulkCreate(
            result.map((item) => ({
              amount: item.price * item.count,
              user_id: item.userID,
              type: "created",
            })),
            { transaction }
          );
          await WebinarProductDetail.destroy({
            where: {
              seatNo: seats,
              webinar_id: webinar_id,
            },
            transaction,
          });
          await PurchaseHistory.update(
            { orderStatus: "Refund" },
            { where: { seatsNo: seats, productID: webinar_id }, transaction }
          );
          const webinar = await WebinarProduct.findOne({
            where: { id: webinar_id },
          });

          webinar.remainingSeats += seats.length;

          await webinar.save({ transaction });
          break;
        case "payment":
          await Promise.all(
            result.map(async (item) => {
              const {
                price,
                count,
                userID,
                transaction_detail: { consumer_profile_id, payment_profile_id },
              } = item;
              console.log("1", 1);
              const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
              merchantAuthenticationType.setName(
                AUTHORIZE_PAYMENT_API_LOGIN_ID
              );
              merchantAuthenticationType.setTransactionKey(
                AUTHORIZE_TRANSACTION_KEY
              );

              const profileToCharge = new ApiContracts.CustomerProfilePaymentType();
              profileToCharge.setCustomerProfileId(consumer_profile_id);

              const paymentProfile = new ApiContracts.PaymentProfile();
              paymentProfile.setPaymentProfileId(payment_profile_id);
              profileToCharge.setPaymentProfile(paymentProfile);

              const transactionRequestType = new ApiContracts.TransactionRequestType();
              transactionRequestType.setTransactionType(
                ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION
              );
              transactionRequestType.setProfile(profileToCharge);
              transactionRequestType.setAmount(price * count);

              const createRequest = new ApiContracts.CreateTransactionRequest();
              createRequest.setMerchantAuthentication(
                merchantAuthenticationType
              );
              createRequest.setTransactionRequest(transactionRequestType);

              const ctrl = new ApiControllers.CreateTransactionController(
                createRequest.getJSON()
              );
              console.log("-------staage---------", process.env.SERVICE_NAME);
              if (process.env.STAGE === "prod") {
                ctrl.setEnvironment(Constants.endpoint.production);
              }
              const exec = promisify(ctrl.execute.bind(ctrl));
              await exec();

              const apiResponse = ctrl.getResponse();

              const response = new ApiContracts.CreateTransactionResponse(
                apiResponse
              );
              if (response != null) {
                if (
                  response.getMessages().getResultCode() ==
                  ApiContracts.MessageTypeEnum.OK
                ) {
                  if (response.getTransactionResponse().getMessages() != null) {
                    console.log("Succsess refound");
                    await WebinarProductDetail.destroy({
                      where: {
                        seatNo: seats,
                        webinar_id: webinar_id,
                        user_id: userID,
                      },
                    });
                    await PurchaseHistory.update(
                      { orderStatus: "Refund" },
                      {
                        where: {
                          seatsNo: seats,
                          productID: webinar_id,
                          userID,
                        },
                      }
                    );
                    const webinar = await WebinarProduct.findOne({
                      where: { id: webinar_id },
                    });

                    webinar.remainingSeats += count;

                    return await webinar.save();
                  } else {
                    throw new Error(
                      response
                        .getTransactionResponse()
                        .getErrors()
                        .getError()[0]
                        .getErrorText()
                    );
                  }
                } else {
                  console.log("Failed Transaction. ");
                  if (
                    response.getTransactionResponse() != null &&
                    response.getTransactionResponse().getErrors() != null
                  ) {
                    throw new Error(
                      response
                        .getTransactionResponse()
                        .getErrors()
                        .getError()[0]
                        .getErrorText()
                    );
                  } else {
                    throw new Error(
                      response.getMessages().getMessage()[0].getText()
                    );
                  }
                }
              } else {
                throw new Error("Null transaction");
              }
            })
          );
          break;
      }
      await transaction.commit();
      return { result: { message: "success" } };
    } catch (err) {
      await transaction.rollback();

      throw new Error(err.message);
    }
  }
}
