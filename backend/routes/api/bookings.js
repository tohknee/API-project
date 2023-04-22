const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const {
  Spot,
  User,
  Booking,
  SpotImage,
  ReviewImage,
} = require("../../db/models");

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
        include: {
          model: SpotImage,
        },
        attributes: { exclude: ["description", "createdAt", "updatedAt"] },
      },
    ],
  });

  const bookingsList = [];

  bookings.forEach((booking) => {
    bookingsList.push(booking.toJSON());
  });

  bookingsList.forEach((booking) => {
    booking.Spot.SpotImages.forEach((image) => {
      if (image.preview === true) {
        booking.Spot.previewImage = image.url;
      }
    });
  });

  bookingsList.forEach((booking) => delete booking.Spot.SpotImages);
  return res.json({ Bookings: bookingsList });
});

router.put("/:bookingId", requireAuth, async (req, res) => {
  const { startDate, endDate } = req.body;

  const bookingId = req.params.bookingId;
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }

  if (booking.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (new Date() > new Date(booking.endDate)) {
    return res.status(403).json({ message: "Past bookings can't be modified" });
  }
  const list = await Booking.findAll({ where: { spotId: booking.spotId } });
  let hasConflict = false;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  if (new Date(booking.startDate).getTime() < new Date().getTime()) {
    hasConflict = true;
    return res
      .status(403)
      .json({ message: "Past bookings can't be modified " });
  }

  list.forEach((booking) => {
    const startDateTaken = new Date(booking.startDate);
    const endDateTaken = new Date(booking.endDate);

    if (newStartDate.getTime() > newEndDate.getTime()) {
      hasConflict = true;
      return res.status(400).json({
        message: "Bad Request ",
        errors: { endDate: "endDate cannot be on or before startDate" },
      });
    }

    if (
      (newStartDate >= startDateTaken && newStartDate < endDateTaken) ||
      (newEndDate > startDateTaken && newEndDate <= endDateTaken) ||
      (newStartDate <= startDateTaken && newEndDate >= endDateTaken)
    ) {
      hasConflict = true;
      return res.status(403).json({
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking",
        },
      });
    }
  });
  if (hasConflict) {
    return;
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
    return res.status(403).json({
      message: "Forbidden ",
    });
  }

  await booking.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
