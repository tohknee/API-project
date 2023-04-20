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

//error booking must belong to current current user
router.put("/:bookingId", requireAuth, async (req, res) => {
  const { startDate, endDate } = req.body;

  const bookingId = req.params.bookingId;
  const booking = await Booking.findByPk(bookingId, { include: [Spot] });
  if (!booking) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({
      message: "Bad request",
      errors: { endDate: "endDate cannot come before startDate" },
    });
  }

  if (booking.Spot.userId !== req.user.id) {
    return res
      .status(401)
      .json({ message: "Booking must belong to the current user" });
  }

  booking.startDate = startDate;
  booking.endDate = endDate;
  await booking.save();

  return res.json(booking);
});

router.delete("/:bookingId", requireAuth, async (req, res) => {
  const bookingId = req.params.bookingId;
  const booking = await Booking.findByPk(bookingId, { include: [Spot] });
  if (!booking) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }
  if (booking.startDate < new Date()) {
    return res.status(403).json({
      message: "Bookings that have been started can't be deleted",
    });
  }
  if (booking.Spot.userId !== req.user.id && booking.userId !== req.user.id) {
    return res.status(401).json({
      message: "Booking must belong to the current user ",
    });
  }

  await booking.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
