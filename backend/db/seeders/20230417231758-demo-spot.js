"use strict";
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = "Spots";
    return queryInterface.bulkInsert(
      options,
      [
        {
          ownerId: 1,
          address: "231 Bowling Lane",
          city: "San Diego",
          state: "California",
          country: "United States of America",
          lat: 17.7645358,
          lng: 452.4730327,
          name: "Bowling",
          description: "Place bowl",
          price: 563,
        },
        {
          ownerId: 2,
          address: "999 Six Flags",
          city: "Concord",
          state: "Texas",
          country: "China",
          lat: 37.7645358,
          lng: -922.4730327,
          name: "School",
          description: "Its a school",
          price: 923,
        },
        {
          ownerId: 3,
          address: "99 owne Flags",
          city: "Creek",
          state: "Oregon",
          country: "Chan",
          lat: 37.7645358,
          lng: -922.4730327,
          name: "third Spot",
          description: "Its a cool",
          price: 53,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Spots";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        ownerId: { [Op.in]: [1, 2] },
      },
      {}
    );
  },
};
