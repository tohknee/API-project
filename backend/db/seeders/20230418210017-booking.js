"use strict";
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = "Bookings";
    return queryInterface.bulkInsert(options, [
      {
        spotId: 1,
        userId: 2,
        startDate: new Date("2021-11-19"),
        endDate: new Date("2021-11-20"),
      },
      {
        spotId: 2,
        userId: 1,
        startDate: new Date("2021-11-19"),
        endDate: new Date("2021-11-20"),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Bookings";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2] },
      },
      {}
    );
  },
};
