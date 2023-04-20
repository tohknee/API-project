const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { Spot, User, Booking, SpotImage } = require("../../db/models");

//importcheck function and handleValidationError function
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

router.delete("/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params.imageId;
  const image = await SpotImage.findByPk(imageId, { include: Spot });

  if (!image) {
    return res.status(404).json({ message: "Spot image couldn't be found" });
  }
  if (image.Spot.userId !== req.user.id) {
    return res.status(403).json({
      message: " Image must belong to the current user",
    });
  }

  await image.destroy();
  return res.json({ message: "Successfully deleted" });
});

module.exports = router;
