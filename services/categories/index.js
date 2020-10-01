import { ModelsList } from "../../libs/db";
const { Category } = ModelsList;

export default class CategoryService {
    static async addCategory({body}) {
        const data = await Category.create(body);
        return {result: {data}};
    }
    static async deleteCategory({body}) {
        const {list} = body;
        await Category.destroy({where: {id: list}});
        return {result: {message: "success"}};
    }
    static async updateCategory({body, params: {id}}) {
        await Category.update(body, {where: {id}});
        return {result: {message: "success"}};
    }
    static async getCategories() {
        const data = await Category.findAll();
        return {result: {data}};
    }
}