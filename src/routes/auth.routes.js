const express = require("express");
const router = express.Router();

const { 
  register,
  login,
  googleLogin,
  uploadProfilePicture,
  updateProfile } = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const { registerSchema,updateProfileSchema } = require("../validators/auth.validation");
const upload = require("../middlewares/upload.middleware");
const authMiddleware = require("../middlewares/auth.middleware");


router.post(
  "/profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  uploadProfilePicture
);

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.patch(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  updateProfile
);
router.post("/login", login);

router.post("/googleLogin", googleLogin);


module.exports = router;