import { ModelsList } from "../../libs/db";
import AWS from "aws-sdk";
import RolesService from "../roles";
const {
  ConsumerUser,
  PhysicalProduct,
  WebinarProduct,
  Winners,
  PurchaseHistory,
  TransactionList,
  PromoCode,
  ProductImageList,
  GiftCard,
  Role,
} = ModelsList;

export default class UsersManagement {
  static async getAllUsers({ query }) {
    const { query_search, limit, offset } = query;
    const scope = [
      {
        method: [
          "with_physical",
          PurchaseHistory,
          PhysicalProduct,
          WebinarProduct,
        ],
      },
      { method: ["with_winner_history", Winners, WebinarProduct] },
      { method: ["with_role", Role] },
      { method: ["paginable", limit, offset] }
    ];
    if (query_search) scope.push({ method: ["searchUsers", query_search] });
    const result = await ConsumerUser.scope(...scope).findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        "username",
        "address",
        "city",
        "state",
        "street_address",
        "zipcode",
        "email",
        "phone_number",
        "auth_banned",
        "comment_banned",
        "createdAt",
      ],
      order: [["username", "ASC"]],
      where: { is_removed: false },
    });
    const count = await ConsumerUser.count({ where: { is_removed: false } });
    return { result: { count, rows: result } };
  }

  static async getUserInfoById({ params: { id } }) {
    const result = await ConsumerUser.findOne({
      where: { id },
      attributes: [
        "email",
        "profile_picture",
        "address",
        "city",
        "state",
        "street_address",
        "zipcode",
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "role_id",
        "user_role"
      ],
      include: [
        {
          model: TransactionList,
          as: "transactions",
          attributes: ["id", "gift_card_amount", "amount", "createdAt"],
          include: [
            {
              model: PromoCode,
              as: "promoCode",
              attributes: ["code_type", "amount"],
            },
            {
              model: PurchaseHistory,
              as: "purchase",
              include: [
                {
                  model: PhysicalProduct,
                  as: "productInfo",
                  attributes: ["productName", "pricePerItem"],
                  include: [
                    {
                      model: ProductImageList,
                      as: "main_image",
                      attributes: ["image_url"],
                    },
                  ],
                },
                {
                  model: WebinarProduct,
                  as: "webinar_product",
                  attributes: ["name", "price_per_seats"],
                  include: [
                    {
                      model: ProductImageList,
                      as: "main_image",
                      attributes: ["image_url"],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Winners,
          as: "winner_history",
          attributes: ["id", "seatNo", "product_type", "updatedAt"],
          include: [
            {
              model: WebinarProduct,
              as: "webinar_parent",
              attributes: ["id", "name", "price_per_seats", "webinar_type"],
              include: [],
            },
            {
              model: GiftCard,
              as: "gifts",
            },
            {
              model: PromoCode,
              as: "seats",
              include: [
                {
                  model: WebinarProduct,
                  as: "webinar",
                },
              ],
            },
            { model: WebinarProduct, as: "webinar" },
          ],
        }
      ],
    });

    return { result };
  }
  static async editUserForAdmin(event) {
    const cognitoserviceprovider = new AWS.CognitoIdentityServiceProvider();
    const requestBody = event.body;
    delete requestBody.is_verified;
    delete requestBody.is_email_verified;
    delete requestBody.is_phone_verified;
    delete requestBody.verified_method;
    delete requestBody.comment_banned;
    delete requestBody.user_role;
    delete requestBody.forgot_link;
    delete requestBody.is_forget;
    console.log(requestBody.id);
    const user = await ConsumerUser.findOne({ where: { id: requestBody.id } });
    if (
      (requestBody.email && requestBody.email !== user.email) ||
      (requestBody.phone_number &&
        requestBody.phone_number !== user.phone_number)
    ) {
      let user_attributes = [];
      if (requestBody.email && requestBody.email !== user.email) {
        user_attributes.push(
          { Name: "email", Value: requestBody.email },
          { Name: "email_verified", Value: "true" }
        );
      }
      if (
        requestBody.phone_number &&
        requestBody.phone_number !== user.phone_number
      ) {
        user_attributes.push(
          { Name: "phone_number", Value: requestBody.phone_number },
          { Name: "phone_number_verified", Value: "true" }
        );
      }
      var params = {
        UserPoolId: process.env.USER_POOL_ID /* required */,
        Username: user.id /* required */,
        UserAttributes: user_attributes,
      };
      console.log(params);
      await cognitoserviceprovider.adminUpdateUserAttributes(params).promise();
      requestBody.is_verified = true;
      requestBody.is_email_verified = true;
      requestBody.is_phone_verfied = true;
    }
    const disableparams = {
      UserPoolId: process.env.USER_POOL_ID /* required */,
      Username: user.id /* required */,
    };
    if (requestBody && requestBody.auth_banned == true) {
      await cognitoserviceprovider.adminDisableUser(disableparams).promise();
    } else if (requestBody && requestBody.auth_banned == false) {
      await cognitoserviceprovider.adminEnableUser(disableparams).promise();
    }

    if (requestBody.role_id) {
      await RolesService.changeUserRole({ user_id: requestBody.id, role_id: requestBody.role_id });
    }

    await ConsumerUser.update(requestBody, { where: { id: requestBody.id } });
    return { result: { message: "success" } };
  }
  static async removeUser(event) {
    if (!event.params.id) {
      throw new Error("You should input id for users");
    }
    const cognitoserviceprovider = new AWS.CognitoIdentityServiceProvider();
    await ConsumerUser.update(
      { is_removed: true },
      { where: { id: event.params.id } }
    );
    const params = {
      UserPoolId: process.env.USER_POOL_ID /* required */,
      Username: event.params.id /* required */,
    };
    const result = await cognitoserviceprovider
      .adminDisableUser(params)
      .promise();
    console.log(result);
    return { result: { message: "success" } };
  }
}
