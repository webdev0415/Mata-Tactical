async function addTimestamps(queryInterface, Sequelize, tableName){
  try {

    const tableDefinition = await queryInterface.describeTable(tableName);
    if(!tableDefinition.createdAt){
      await queryInterface.addColumn(tableName, 'createdAt', 'TIMESTAMP');
    }
    if(!tableDefinition.updatedAt){
      await queryInterface.addColumn(tableName, 'updatedAt', 'TIMESTAMP');
    }
  } catch (err) {
    console.log('err', err);
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const res = await queryInterface.sequelize.query('SHOW TABLES', { type: Sequelize.QueryTypes.SELECT });
    const tables = res.map((item) => Object.entries(item).map(([i, v]) => v)).flat().filter(t => t !== 'SequelizeMeta');
    await Promise.all(tables.map((tableName) => addTimestamps(queryInterface, Sequelize, tableName)));
  },

  down: (queryInterface, Sequelize) => {
  }
};
