import ProductService from "../products";
import ScheduleService from '../schedule';
import { ModelsList } from "../../libs/db";
import { Op } from "sequelize";
const {PhysicalProduct, WebinarProduct, ProductImageList } = ModelsList;
export const main = async (event) => {
  try {
    console.log(event);
    const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
    const now = new Date().toISOString();
    const resultWebinar = await WebinarProduct.scope(...scope).findAll({
      where: {
        publish_method: "scheduled",
        product_status: "inactive",
        scheduled_time: {
          [Op.lte]: now,
        },
      },
    });
    const resultPhysical = await PhysicalProduct.scope(...scope).findAll({
      where: {
        publish_method: "scheduled",
        product_status: "inactive",
        scheduled_time: {
          [Op.lte]: now,
        },
      },
    });
    await PhysicalProduct.update(
      { product_status: "active", scheduled_time: now },
      {
        where: {
          publish_method: "scheduled",
          product_status: "inactive",
          scheduled_time: {
            [Op.lte]: now,
          },
        },
      }
    );
    await WebinarProduct.update(
      { product_status: "active", scheduled_time: now },
      {
        where: {
          publish_method: "scheduled",
          product_status: "inactive",
          scheduled_time: {
            [Op.lte]: now,
          },
        },
      }
    );
    await ScheduleService.watchScheduleProductEvent();
    if (resultWebinar && resultWebinar.length > 0) {
      const promises = resultWebinar.map(async (product) => {
        await ProductService.sendAlerts(
          "webinar",
          product.id,
          "new_product",
          product.name,
          product.main_image
            ? product.main_image.image_url
              ? product.main_image.image_url
              : ""
            : ""
        );
      });
      await Promise.all(promises);
    }
    if (resultPhysical && resultPhysical.length > 0) {
      const promisesPhysical = resultPhysical.map(async (product) => {
        await ProductService.sendAlerts(
          "physical",
          product.id,
          "new_product",
          product.productName,
          product.main_image
            ? product.main_image.image_url
              ? product.main_image.image_url
              : ""
            : ""
        );
      });
      await Promise.all(promisesPhysical);
    }
  } catch (err) {
      console.log(err);
  }
};
