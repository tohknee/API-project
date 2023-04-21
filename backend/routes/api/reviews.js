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

//need aliasing Spot Images to previewImage
router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;

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
        ],
        include: {
          model: SpotImage,
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
  return res.json({ Reviews: list });
});

router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const { url } = req.body;
  const review = await Review.findByPk(req.params.reviewId);
  const userId = req.user.id;

  const findReviewWithUser = await Review.findOne({ where: { userId } });
  const existingReview = await Review.findByPk(req.params.reviewId);
  console.log(findReviewWithUser);

  if (userId !== existingReview.userId) {
    return res.status(403).json({ message: " forbidden" });
  }
  const imageCount = await ReviewImage.findAll({
    where: { reviewId: req.params.reviewId },
  });

  // const reviews = await Review.findOne({
  //   where: { id: review.id },
  // });

  if (!existingReview) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (imageCount.length >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  const newReviewImage = await ReviewImage.create(
    {
      url,
      reviewId: req.params.reviewId, //not sure if i need review id here
    },
    {
      attributes: ["id", "url"],
    }
  );
  return res.json(newReviewImage);
});

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .isNumeric({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors,
];

//is it ok that the forbidden error hits before the review not found

router.put("/:reviewId", requireAuth, validateReview, async (req, res) => {
  const { review, stars } = req.body;

  const reviewToEdit = await Review.findByPk(req.params.reviewId);

  if (!reviewToEdit) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (reviewToEdit.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  (reviewToEdit.review = review),
    (reviewToEdit.stars = stars),
    await reviewToEdit.save();

  return res.json(reviewToEdit);
});

router.delete("/:reviewId", requireAuth, async (req, res) => {
  const reviewToDelete = await Review.findByPk(req.params.reviewId);

  if (!reviewToDelete) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (reviewToDelete.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await reviewToDelete.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
