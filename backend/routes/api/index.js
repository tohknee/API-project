const router = require("express").Router();

//test api router. to test past fetch request into console and replace value of XSRF TOKEN
router.post("/test", function (req, res) {
  res.json({ requestBody: req.body });
});

module.exports = router;
