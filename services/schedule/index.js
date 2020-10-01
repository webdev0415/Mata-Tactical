import { ModelsList } from "../../libs/db";
import { QueryTypes } from "sequelize";
import AWS from "aws-sdk";
const { sequelize } = ModelsList;
export default class ScheduleService {
  static async watchScheduleProductEvent() {
    const cwe = new AWS.CloudWatchEvents();
    const result = await sequelize.query(
      'SELECT `physical_products`.`scheduled_time` AS `schedule_time` FROM `physical_products` WHERE `physical_products`.`product_status` = "inactive" AND `physical_products`.`publish_method`="scheduled" AND `physical_products`.`scheduled_time` > NOW() UNION ALL SELECT `webinar_products`.`scheduled_time` AS `schedule_time` FROM `webinar_products` WHERE `webinar_products`.`product_status` = "inactive" AND `webinar_products`.`publish_method`="scheduled" AND `webinar_products`.`scheduled_time` > NOW() ORDER BY `schedule_time` ASC LIMIT 1',
      {
        type: QueryTypes.SELECT,
      }
    );
    if (result && result.length > 0) {
      let resultDate = result[0].schedule_time;
      console.log(resultDate);
      const expression = `cron(${resultDate.getUTCMinutes()} ${resultDate.getUTCHours()} ${resultDate.getUTCDate()} ${
        resultDate.getUTCMonth() + 1
      } ? ${resultDate.getUTCFullYear()})`;
      console.log(expression);
      await cwe
        .putRule({
          Name: "ScheduledProduct",
          ScheduleExpression: expression,
          Description: resultDate.toISOString(),
          State: "ENABLED",
        })
        .promise();
        await cwe
          .putTargets({
            Rule: "ScheduledProduct",
            Targets: [
              {
                Id: "lambda-trigger",
                Arn:`arn:aws:lambda:${process.env.REGION}:${process.env.ACCOUNT_ID}:function:${process.env.SERVICE_NAME}-${process.env.STAGE}-scheduleproduct`,
                Input: JSON.stringify({
                  time: resultDate.toISOString(),
                }),
              },
            ],
          })
          .promise();
    }
    else
    {
      await cwe.disableRule({
        Name: "ScheduledProduct",
      }).promise();
    }
    return { result : 'success' };
  }
}
