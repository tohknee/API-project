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

router.delete("/:imageId", async (req, res) => {
  const { imageId } = req.params;
  const image = await ReviewImage.findByPk(imageId);

  if (!image) {
    return res.status(404).json({ message: "Review Image couldn't be found" });
  }

  const review = await Review.findByPk(image.reviewId);
  if (req.user.id !== review.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
