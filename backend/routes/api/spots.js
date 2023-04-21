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
    include: [{ model: SpotImage }, { model: Review }],
  });
  let spotsList = [];
  spots.forEach((spot) => {
    spotsList.push(spot.toJSON());
  });
  spotsList.forEach((spot) => {
    let star = 0;
    let counter = 0;
    spot.Reviews.forEach((review) => {
      star += review.stars;
      counter++;
    });
    spot.avgRating = star / counter;

    spot.SpotImages.forEach((image) => {
      if (image.preview === true) {
        spot.previewImage = image.url;
      }
    });
  });
  spotsList.forEach((spot) => delete spot.SpotImages);
  spotsList.forEach((spot) => delete spot.Reviews);
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

  return res.json({ Bookings: bookingOwner });
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

  return res.json({ Reviews: reviews });
});

router.get("/:spotId", async (req, res) => {
  const spotId = req.params.spotId;
  const spot = await Spot.findByPk(spotId);

  const spots = await Spot.findAll({
    where: {
      id: spotId,
    },
    include: [
      {
        model: Review,
      },
      {
        model: SpotImage,
      },
      {
        model: User,
        // as: "Owner",
      },
    ],
  });
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  // let spotsList = [spot.toJSON()];

  let spotsList = [];
  spots.forEach((spot) => {
    spotsList.push(spot.toJSON());
  });

  spotsList.forEach((spot) => {
    let star = 0;
    let counter = 0;
    spot.Reviews.forEach((review) => {
      star += review.stars;
      counter++;
    });
    spot.avgStarRating = star / counter;
    spot.numReviews = counter;
  });

  spotsList.forEach((spot) => delete spot.Reviews);
  const [innerSpots] = spotsList;
  return res.json(innerSpots);
});

router.get("/", async (req, res) => {
  const reviewCount = await Review.findAll();
  const spots = await Spot.findAll({
    include: [{ model: SpotImage }, { model: Review }],
  });

  let spotsList = [];
  spots.forEach((spot) => {
    spotsList.push(spot.toJSON());
  });
  spotsList.forEach((spot) => {
    let star = 0;
    let counter = 0;
    spot.Reviews.forEach((review) => {
      star += review.stars;
      counter++;
    });
    spot.avgRating = star / counter;

    spot.SpotImages.forEach((image) => {
      if (image.preview === true) {
        spot.previewImage = image.url;
      }
    });
  });

  spotsList.forEach((spot) => delete spot.SpotImages);
  spotsList.forEach((spot) => delete spot.Reviews);
  return res.json({ Spots: spotsList });
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
  check("price").notEmpty().isDecimal().withMessage("Provide price"),
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

//need to check if date is already booked
router.post("/:spotId/bookings", requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const spot = await Spot.findByPk(spotId);
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        endDate: "endDate cannot be on or before startDate",
      },
    });
  }

  const booking = await Booking.create({
    spotId: spotId,
    userId: userId,
    startDate: startDate,
    endDate: endDate,
  });
  return res.json(booking);
});

router.post(
  "/:spotId/reviews",
  requireAuth,
  validateReview,
  async (req, res) => {
    const { review, stars } = req.body;
    const spotId = await Spot.findByPk(req.params.spotId);
    if (!spotId) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }
    const aReviewExists = await Review.findOne({
      where: {
        spotId: spotId.id,
        userId: req.user.id,
      },
    });

    if (aReviewExists) {
      return res
        .status(500)
        .json({ message: "User already has a review for this spot" });
    }
    const newReview = await Review.create({
      userId: req.user.id,
      spotId: spotId.id,
      review,
      stars,
    });
    return res.status(201).json(newReview);
  }
);

router.post("/:spotId/images", requireAuth, async (req, res) => {
  const { url, preview } = req.body;
  const spotId = await Spot.findByPk(req.params.spotId);
  const user = req.user.id;
  if (!spotId) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (user !== spotId.ownerId) {
    return res.status(403).json({ message: "Forbidden" });
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

  if (req.user.id !== spot.ownerId) {
    return res.status(403).json({ message: "Forbidden" });
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
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
  if (req.user.id !== spot.ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await spot.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
