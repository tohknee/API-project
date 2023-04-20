const router = require("express").Router();
//connect session and users routers
const sessionRouter = require("./session.js");
const usersRouter = require("./users.js");
const spotsRouter = require("./spots.js");
const reviewsRouter = require("./reviews.js");
const bookingsRouter = require("./bookings.js");

const { restoreUser } = require("../../utils/auth.js");

// //test api router. to test past fetch request into console and replace value of XSRF TOKEN
router.post("/test", function (req, res) {
  res.json({ requestBody: req.body });
});

// router.get("/restore-user", (req, res) => {
//   return res.json(req.user);
// });

const { requireAuth } = require("../../utils/auth.js");
// router.get("/require-auth", requireAuth, (req, res) => {
//   return res.json(req.user);
// });

router.use(restoreUser); //restoreUsers middleware connection

// Connect restoreUser middleware to the API router after restoreUser middleware connection above
// If current user session is valid, set req.user to the user in the database
// If current user session is not valid, set req.user to null

router.use("/session", sessionRouter);
router.use("/users", usersRouter);
router.use("/spots", spotsRouter);
router.use("/reviews", reviewsRouter);
router.use("/bookings", bookingsRouter);
router.post("/test", (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
