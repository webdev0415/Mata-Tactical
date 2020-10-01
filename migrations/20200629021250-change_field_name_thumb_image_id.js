module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.renameColumn('webinar_products', 'imageUrl', 'primary_image_id'),
    queryInterface.renameColumn('physical_products','imageUrl','primary_image_id')
  ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.renameColumn('webinar_products', 'primary_image_id', 'imageUrl'),
    queryInterface.renameColumn('physical_products','primary_image_id','imageUrl')
  ]);
  }
};