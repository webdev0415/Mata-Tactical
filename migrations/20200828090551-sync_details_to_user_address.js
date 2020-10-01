var parseAddress = require("parse-address-string");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query(
        "SELECT id, address FROM consumer_users",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises = users.map(async (user) => {
        console.log(user.address);
        parseAddress(user.address, async (err, details) => {
          console.log(details);
          await queryInterface.sequelize.query(
            `UPDATE consumer_users SET street_address=:street_address ,zipcode=:zip_code, city=:city, state=:state WHERE id=:id`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                street_address: details.street_address1,
                city: details.city,
                state: details.state,
                zip_code: details.postal_code,
                id: user.id,
              },
            }
          );
          if (err) {
            console.log(err);
          }
        });
      });
      await Promise.all(promises);
      const ffls = await queryInterface.sequelize.query(
        "SELECT id, location FROM ffl_tables",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises1 = ffls.map(async (ffl) => {
        parseAddress(ffl.location, async (err, details) => {
          console.log(details);
          await queryInterface.sequelize.query(
            `UPDATE ffl_tables SET street_address=:street_address ,zipcode=:zip_code, city=:city, state=:state WHERE id=:id`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                street_address: details.street_address1,
                city: details.city,
                state: details.state,
                zip_code: details.postal_code,
                id: ffl.id,
              },
            }
          );
          if (err) {
            console.log(err);
          }
        });
      });
      await Promise.all(promises1);
      const purchase_histories = await queryInterface.sequelize.query(
        "SELECT id, shipping_address FROM purchase_histories",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises2 = purchase_histories.map(async (el) => {
        // console.log(user.address);
        parseAddress(el.shipping_address, async (err, details) => {
          console.log(details);
          await queryInterface.sequelize.query(
            `UPDATE purchase_histories SET street_address=:street_address ,zipcode=:zip_code, city=:city, state=:state WHERE id=:id`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                street_address: details.street_address1,
                city: details.city,
                state: details.state,
                zip_code: details.postal_code,
                id: el.id,
              },
            }
          );
          if (err) {
            console.log(err);
          }
        });
      });
      await Promise.all(promises2);
      const winners = await queryInterface.sequelize.query(
        "SELECT id, shipping_address FROM winners",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises3 = winners.map(async (el) => {
        // console.log(user.address);
        parseAddress(el.shipping_address, async (err, details) => {
          console.log(details);
          await queryInterface.sequelize.query(
            `UPDATE winners SET street_address=:street_address ,zipcode=:zip_code, city=:city, state=:state WHERE id=:id`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                street_address: details.street_address1,
                city: details.city,
                state: details.state,
                zip_code: details.postal_code,
                id: el.id,
              },
            }
          );
          if (err) {
            console.log(err);
          }
        });
      });
      await Promise.all(promises3);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
