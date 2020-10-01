import { ModelsList } from "../../libs/db";
const { GiftCard, ConsumerUser } = ModelsList;

export default class GiftCardService {
  static async createCard({ body }) {
    const { user_id = "", ...gift } = body;
    if (!user_id) throw new Error("The field 'user_id' is required");
    const result = await GiftCard.create({ ...gift, user_id, type: "created" });
    return { result };
  }

  static async createUsedCard({ amount, user_id, transaction_id }) {
    GiftCard.create({ user_id, amount, transaction_id, status: "used" });
  }

  static async usersGiftCards(req) {
    return {
      result: await GiftCard.findAll({
        where: { user_id: req.requestContext.authorizer.sub },
      }),
    };
  }

  static async getAllGiftCards({ query: { limit, offset } }) {
    const scope = [
      { method: ["withUser", ConsumerUser] },
      { method: ["paginable", limit, offset] },
    ];
    const result = await GiftCard.scope(...scope).findAndCountAll({
      where: { type: "created" },
      order: [["createdAt", "DESC"]],
    });
    return { result };
  }

  static async createWonCards(cards) {
    return await GiftCard.bulkCreate(cards.map((card) => ({ ...card, type: "won" })));
  }

  static async setUserToCard(items) {
    return {
      result: await GiftCard.bulkCreate(items, {
        updateOnDuplicate: ["user_id"],
        ignoreDuplicates: true,
      }),
    };
  }

  static async setUsedCard(cards) {
    return {
      result: await GiftCard.bulkCreate(
        cards.map((el) => ({ ...el, status: "used" })),
        {
          updateOnDuplicate: ["transaction_id", "status"],
          ignoreDuplicates: true,
        }
      ),
    };
  }
}
