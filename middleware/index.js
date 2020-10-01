import { ModelsList } from "../libs/db";
const { ActivityLog } = ModelsList;
export default class middleware {
  static async checkLoginActivity(req, res, next) {
    let date_ob = new Date();
    date_ob.setMinutes(0, 0, 0);
    if (
      !req ||
      !req.requestContext ||
      !req.requestContext.authorizer ||
      !req.requestContext.authorizer.email
    ) {
      next();
    }
    const activity_log = await ActivityLog.findOne({
      where: { email: req.requestContext.authorizer.email || "" },
      limit: 1,
      order: [["createdAt", "DESC"]],
    });
    if (
      !activity_log ||
      (activity_log &&
        activity_log.logged_in_time.toISOString() != date_ob.toISOString())
    ) {
      await ActivityLog.create({
        email: req.requestContext.authorizer.email,
        logged_in_time: date_ob.toISOString(),
      });
    }
    console.log('finish-----------');
    next();
  }

  static checkPermissions(nameAPI, otherAPI = null) {
    return (req, res, next) => {
      if (process.env.USING_ROLES === "true") {
        const userPermissions =
          req.requestContext.authorizer.permissionList || "";
        if (
          userPermissions.split(",").includes(nameAPI) ||
          (otherAPI && userPermissions.split(",").includes(otherAPI))
        ) {
          return next();
        }
        res.status(403).json({ message: "Forbidden error" });
      } else {
        return next();
      }
    };
  }
}
