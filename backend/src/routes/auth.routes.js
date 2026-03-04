import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  getCurrentUser,
  resendEmailVerificationToken,
  refreshAccessToken,
  forgetPasswordRequestHandler,
  resetForgetPasswordHandler,
  changePasswordHandler,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidation,
  userLoginValidation,
  userChangeCurrentPasswordValidator,
  userForgetPasswordValidator,
  userResetForgetPasswordValidator,
} from "../validators/index.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

//  Unsecured routes not require JWT Token
router
  .route("/register")
  .post(userRegisterValidation(), validate, registerUser);
router.route("/login").post(userLoginValidation(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/forget-password")
  .post(userForgetPasswordValidator(), validate, forgetPasswordRequestHandler);
router
  .route("/reset-password/:resetToken")
  .post(
    userResetForgetPasswordValidator(),
    validate,
    resetForgetPasswordHandler,
  );

//  Secure routes require JWT TOKEN
router.route("/logout").post(VerifyJWT, logoutUser);

router.route("/current").get(VerifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changePasswordHandler,
  );
router
  .route("/resend-verification-email")
  .post(VerifyJWT, resendEmailVerificationToken);
export default router;
