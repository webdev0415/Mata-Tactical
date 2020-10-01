import { ModelsList } from "../../libs/db";
const { FAQList } = ModelsList;

export default class FAQService {
  static async addFAQ({ body }) {
    const data = await FAQList.create(body);
    return { result: { data } };
  }
  static async deleteFAQ({ params: { id } }) {
    await FAQList.destroy({ where: { id } });
    return { result: { message: "success" } };
  }
  static async updateFAQ({ body, params: { id } }) {
    await FAQList.update(body, { where: { id } });
    return { result: { message: "success" } };
  }
  static async getFAQ() {
    const data = await FAQList.findAll();
    return { result: { data } };
  }
}
