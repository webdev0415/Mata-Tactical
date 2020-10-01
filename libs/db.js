import Sequelize from "sequelize";
import * as Models from "../models";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialectOptions: { charset: "utf8" },
    dialect: "mysql",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    pool: {
      max: 5,
      min: 0,
      idle: 20000,
      acquire: 20000,
      handleDisconnects: true,
    },
    retry: {
      match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
      ],
      max: 5
     },
  }
);

const models = {};
Object.keys(Models).forEach((prop) => {
  models[prop] = Models[prop].init(sequelize, Sequelize);
  (models[prop].scopes || []).forEach((scope) =>
    models[prop].addScope(...scope)
  );
});

Object.values(models)
  .filter((model) => typeof model.associate === "function")
  .forEach((model) => model.associate(models));

export const ModelsList = { ...models, sequelize };

const getConnection = async () => {
  try {
    await sequelize.authenticate();
    return { ...models, sequelize };
  } catch (err) {
    return getConnection();
  }
};
export default getConnection;

// export default async () => {
//   try {
//     await sequelize.authenticate()
//     return { ...models, sequelize };
//   } catch (err) {
//     await sequelize.authenticate();
//     return { ...models, sequelize };
//   }
// };
