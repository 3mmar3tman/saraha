const router = require("express").Router();

const {
  sendMessage,
  getMyMessages
} = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", sendMessage);

router.get(
  "/my-messages",
  authMiddleware,
  getMyMessages
);
module.exports = router;