const express = require("express");
const router = express.Router();
const { getApartments } = require("./apartment.controller");

router.get("/", getApartments);

module.exports = router;
