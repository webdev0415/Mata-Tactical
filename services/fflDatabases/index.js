import { ModelsList } from "../../libs/db";
import AWS from "aws-sdk";
const {
  FFLTable,
  Winners,
  ConsumerUser,
  WebinarProduct,
  PurchaseHistory,
  PhysicalProduct,
} = ModelsList;

export default class FFLDatabaseService {
  static async addDatabase({ body }) {
    const data = await FFLTable.create(body);
    return { result: { data } };
  }
  static async getDatabases({ query }) {
    const { offset, limit } = query;
    const scope = [
      {
        method: [
          "withWinners",
          Winners,
          ConsumerUser,
          WebinarProduct,
          PurchaseHistory,
          PhysicalProduct,
        ],
      },
      { method: ["paginable", limit, offset] }
    ];
    const data = await FFLTable.scope(...scope).findAll({
      where: {is_removed: false},
      order: [["ffl_name", "ASC"]],
    });
    const count = await FFLTable.count();
    return { result: { rows: data, count } };
  }
  static async deleteFFL(event) {
    if (!event.params.id) {
      throw new Error("You should input id for the param");
    }
    await FFLTable.update({is_removed: true},{where: {id: event.params.id}});
    return {result: 'success'};
  }
  static async updateFFL(event) {
    if (!event.params.id) {
      throw new Error("You should input id for the param");
    }
    let previous_image_url = "";
    const ffl_data = await FFLTable.findOne({
      attributes: ["ffl_image_url"],
      where: {
        id: event.params.id,
      },
    });
    if(ffl_data.is_removed)
    {
      throw new Error("This ffl data is deleted");
    }
    if (event.body.ffl_image_url != null) {
      previous_image_url = ffl_data.ffl_image_url ? ffl_data.ffl_image_url : "";
    }
    await FFLTable.update(event.body, {
      where: {
        id: event.params.id,
      },
    });
    if (
      previous_image_url !== "" &&
      event.body.ffl_image_url != previous_image_url
    ) {
      const s3 = new AWS.S3();
      var params = {
        Bucket: process.env.S3_IMAGE_BUCKET,
        Key: previous_image_url,
      };
      const result = await s3.deleteObject(params).promise();
      console.log("-------remove s3----", result);
      var thumbParams = {
        Bucket: process.env.S3_IMAGE_BUCKET,
        Key: `thumbnail-${previous_image_url}`,
      };
      await s3.deleteObject(thumbParams).promise();
    }
    return { result: { message: "success" } };
  }
}
