import express from "express";
import * as userController from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateUpdateMe, validateSubscribe } from "../middlewares/validators.js";

const router = express.Router();

// Any route defined after this middleware will be protected
router.use(protect);

// get current user data
router.get("/me", userController.getMe);

router.get("/:id/public", userController.getPublicProfile);

router.get("/:id/private", userController.getPrivateProfile);
router.patch(
  "/update-me",
  userController.uploadUserAvatar,
  userController.resizeUserAvatar,
  validateUpdateMe,
  userController.updateMe
);

router.post("/toggle-my-role", userController.toggleCurrentUserRole);
router.get("/can-toggle-role", userController.canToggleRole);
router.post("/subscribe", validateSubscribe, userController.subscribe);

export default router;
