import { ModelsList } from "../../libs/db";
import {Op} from 'sequelize';
import AWS from 'aws-sdk';
const { BackgroundList } = ModelsList;

export default class BackgroundService {
  static async add({ body }) {
    if (!body.start_from || !body.end_to || !body.image_url) {
        throw new Error(
          "You should input all the required parameters:  start_from, end_to, image_url"
        );
    }
    const result = await BackgroundList.findOne({
      where: {
        end_to: {
          [Op.gte]: body.start_from,
        },
        start_from: {
          [Op.lte]: body.end_to,
        },
      },
    });
    if (result) {
      throw new Error("The time is already set with another background image");
    }
    await BackgroundList.create(body);
    return { result: { message: 'success' } };
  }
  static async update(event) {
    const { body } = event;
      if (!body.start_from || !body.end_to ) {
      throw new Error(
        "You should input all the required parameters: id, start_from, end_to"
      );
    }
    const result = await BackgroundList.findOne({
      where: {
        end_to: {
          [Op.gte]: body.start_from,
        },
        start_from: {
          [Op.lt]: body.end_to,
        },
        [Op.not]: {
            id: event.params.id
        }
      },
    });
    if (result) {
      throw new Error("The time is already set with another background image");
    }
    await BackgroundList.update(
      body,
      { where: { id: event.params.id } }
    );
    return { result: { message: "success" } };
  }
  static async remove({ body }) {
    if (!body.id) {
      throw new Error("You should input id");
    }
    const result = await BackgroundList.findOne({where: {id: body.id}});
    if (!result)
    {
        throw new Error('There is no such item');
    }
    const s3 = new AWS.S3();
    var params = {
      Bucket: process.env.S3_IMAGE_BUCKET,
      Key: result.image_url,
    };
    await s3.deleteObject(params).promise();
    await BackgroundList.destroy({ where: { id: body.id } });
    return { result: { message: "success" } };
  }
  static async getActiveImage() {
    const data = await BackgroundList.findOne({
      attributes: ["image_url"],
      where: {
        end_to: {
          [Op.gte]: new Date(),
        },
        start_from: {
          [Op.lte]: new Date(),
        },
      },
    });
    return { result: { data } };
  }
  static async getAll() {
    const data = await BackgroundList.findAll();
    return { result: { data } };
  }
}
