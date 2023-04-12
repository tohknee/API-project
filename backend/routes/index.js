// backend/routes/index.js
const express = require("express");
const router = express.Router();

//this is a test route. should display Hello World!
// router.get("/hello/world", function (req, res) {
//   res.cookie("XSRF-TOKEN", req.csrfToken()); //setting cookie on the response with name of XSRF-token and value of req.csrfToken methods return
//   res.send("Hello World!"); //send Hello World! as res body
// });

// Add a XSRF-TOKEN cookie
router.get("/api/csrf/restore", (req, res) => {
  const csrfToken = req.csrfToken();
  res.cookie("XSRF-TOKEN", csrfToken);
  res.status(200).json({
    "XSRF-Token": csrfToken,
  });
});

module.exports = router;
