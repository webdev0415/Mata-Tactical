import serverless from "serverless-http";
import express from "express";
import bodyParser from "body-parser";
import router from "./router";
const app = express();
const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "500kb" }));
app.use("/consumer", router);
export const handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return serverless(app)(event, context, callback);
};
