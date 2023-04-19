"use strict";
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = "Reviews";
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        spotId: 1,
        review: "this is good spot",
        stars: 5,
      },
      {
        userId: 1,
        spotId: 2,
        review: "spot not good",
        stars: 1,
      },
      {
        userId: 2,
        spotId: 1,
        review: "good spot",
        stars: 4,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Reviews";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        userId: { [Op.in]: [1, 2] },
      },
      {}
    );
  },
};
