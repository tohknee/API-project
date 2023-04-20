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
  const spots = await Spot.findAll({
    where: {
      ownerId: userId,
    },
    include: [{ model: SpotImage }],
  });

  let spotsList = [];
  spots.forEach((spot) => {
    spotsList.push(spot.toJSON());
  });
  spotsList.forEach((spot) => {
    spot.SpotImages.forEach((image) => {
      if (image.preview === true) {
        spot.previewImage = image.url;
      }
    });
  });
  spotsList.forEach((spot) => delete spot.SpotImages);
  return res.json({ Spots: spotsList });
});

router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
    const bookingUser = await Booking.findAll({
      where: { spotId: spot.id },
      attributes: ["spotId", "startDate", "endDate"],
    });
    return res.json({ Bookings: bookingUser });
  }

  const bookingOwner = await Booking.findAll({
    where: {
      spotId: spot.id,
    },
    include: {
      model: User,
      attributes: ["id", "firstName", "lastName"],
    },
  });
  console.log(bookingOwner);
  return res.json({ Booking: bookingOwner });
});

router.get("/:spotId/reviews", async (req, res) => {
  const spotId = req.params.spotId;
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
  const reviews = await Review.findAll({
    where: {
      spotId: spotId,
    },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  return res.json(reviews); //{ Reviews: reviews }
});

router.get("/:spotId", async (req, res) => {
  const spotId = req.params.spotId;
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
  const spots = await Spot.findAll({
    where: {
      id: spotId,
    },
    include: [
      {
        model: SpotImage,
      },
      {
        model: User,
      },
    ],
  });
  return res.json(spots);
});

router.get("/", async (req, res) => {
  const reviewCount = await Review.findAll();
  const spots = await Spot.findAll();

  return res.json(spots);
});

const validatePost = [
  check("address").exists({ checkFalsy: true }).withMessage("Provide address"),
  check("city").exists({ checkFalsy: true }).withMessage("Provide city"),
  check("state").exists({ checkFalsy: true }).withMessage("Provide state"),
  check("country").exists({ checkFalsy: true }).withMessage("Provide country"),
  check("lat")
    .exists({ checkFalsy: true })
    .isDecimal()
    .withMessage("Latitude is not valid"),
  check("lng")
    .exists({ checkFalsy: true })
    .isDecimal()
    .withMessage("Longitude is not valid"),
  check("name")
    .exists({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage("Provide name"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Provide description"),
  check("price").notEmpty().withMessage("Provide price"),
  handleValidationErrors,
];

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

router.post(
  "/:spotId/reviews",
  requireAuth,
  validateReview,
  async (req, res) => {
    const { review, stars } = req.body;
    const spotId = await Spot.findByPk(req.params.spotId);

    const aReviewExists = await Review.findOne({
      where: {
        spotId: spotId.id,
        userId: req.user.id,
      },
    });
    if (!spotId) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }
    if (aReviewExists) {
      return res
        .status(500)
        .json({ message: "User already has a review for this spot" });
    }
    const newReview = await Review.create({
      userId: req.uiser.d,
      spotId: spotId.id,
      review,
      stars,
    });
    return res.json(newReview);
  }
);

router.post("/:spotId/images", requireAuth, async (req, res) => {
  const { url, preview } = req.body;
  const spotId = await Spot.findByPk(req.params.spotId);
  if (!spotId) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const newImage = await SpotImage.create({
    url,
    preview,
  });
  return res.json({
    id: newImage.id,
    url: newImage.url,
    preview: newImage.preview,
  });
});

router.post("/", requireAuth, validatePost, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const newSpot = await Spot.create({
    ownerId: req.user.id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  return res.json(newSpot);
});

router.put("/:spotId", requireAuth, validatePost, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const spot = await Spot.findByPk(req.params.spotId);

  if (req.user.id !== Spot.ownerId) {
    return res
      .status(404)
      .json({ message: "Spot must belong to the current user" });
  }
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  (spot.address = address),
    (spot.city = city),
    (spot.state = state),
    (spot.country = country),
    (spot.lat = lat),
    (spot.lng = lng),
    (spot.name = name),
    (spot.description = description),
    (spot.price = price),
    await spot.save();

  return res.json(spot);
});

router.delete("/:spotId", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (req.user.id !== spot.ownerId) {
    return res
      .status(403)
      .json({ message: "Spot must belong to the current user" });
  }

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  await spot.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
