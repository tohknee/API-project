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
        include: {
          model: SpotImage,
          // as: "previewImage",
          attributes: ["url"],
          where: { preview: true },
        },
      },
      { model: ReviewImage, attributes: ["id", "url"] },
    ],
  });
  let list = [];
  reviews.forEach((review) => {
    list.push(review.toJSON());
  });
  list.forEach((review) => {
    review.Spot.SpotImages.forEach((image) => {
      if (image.preview === true) {
        review.Spot.previewImage = image.url;
      }
    });
  });
  list.forEach((review) => delete review.Spot.SpotImages);
  return res.json({ Reviews: reviews });
});

module.exports = router;
