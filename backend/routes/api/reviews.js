const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const {
  Spot,
  SpotImage,
  User,
  Review,
  ReviewImage,
  Booking,
} = require("../../db/models");

//importcheck function and handleValidationError function
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const spotimage = require("../../db/models/spotimage");

const router = express.Router();

router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;
  // if (userId !== userId.ownerId) {
  //   return res
  //     .status(403)
  //     .json({ message: "Spot must belong to the current user" });
  // }

  const reviews = await Review.findAll({
    where: {
      userId: userId,
    },
    include: [
      { model: User, attributes: ["id", "firstName", "lastName"] },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "lat",
          "lng",
          "name",
          "price",
          //   "previewImage",
        ],
      },
      { model: ReviewImage, attributes: ["id", "url"] },
    ],
  });
  return res.json({ Reviews: reviews });
});

module.exports = router;
