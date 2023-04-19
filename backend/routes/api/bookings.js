const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { Spot, User, Booking } = require("../../db/models");

//importcheck function and handleValidationError function
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

router.get("/current", async (req, res) => {
  const userId = req.user.userId;
  const bookings = await Booking.findAll({
    where: {
      ownerId: userId,
    },
    include: [
      {
        model: Spot,
      },
    ],
  });
  return res.json(bookings);
});

//crete booking from a spot based on spot id
// router.post('/:spotId/bookings', requireAuth, async (req, res) => {
//   const spotId= req.params.spotId;

// })
