const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { Spot, SpotImage } = require("../../db/models");

//importcheck function and handleValidationError function
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

router.get("/current", async (req, res) => {
  const userId = req.user.id;
  const spots = await Spot.findAll({
    where: {
      ownerId: userId,
    },
  });
  return res.json(spots);
});

router.get("/:spotId", async (req, res) => {
  const spotId = req.params.spotId;
  const spots = await Spot.findAll({
    where: {
      id: spotId,
    },
  });
  return res.json(spots);
});

router.get("/", async (req, res) => {
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

router.post("/:spotId/images", async (req, res) => {
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

router.post("/", validatePost, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const newSpot = await Spot.create({
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

module.exports = router;
