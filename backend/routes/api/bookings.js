const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { Spot, User, Booking } = require("../../db/models");

//importcheck function and handleValidationError function
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const bookings = await Booking.findAll({
    where: {
      userId: userId,
    },
    include: [
      {
        model: Spot,
      },
    ],
  });
  return res.json(bookings);
});

router.get;

//crete booking from a spot based on spot id
// router.post('/:spotId/bookings', requireAuth, async (req, res) => {
//   const spotId= req.params.spotId;

// })

module.exports = router;
