import { body } from "express-validator";

const userRegisterValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email is here"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLowercase()
      .withMessage("Username must be in lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("passwords is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};
//  Login User
const userLoginValidation = () => {
  return [
    body("email").isEmail().withMessage("Invalid email is here").optional(),
    body("username").isLowercase().withMessage("Username must be in lowercase"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};
const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").isEmpty().withMessage("Current password is required"),
    body("newPassword").isEmpty().withMessage("new password is required"),
  ];
};
const userForgetPasswordValidator = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Invalid email is here")
      .optional()
      .notEmpty()
      .withMessage("Email is required"),
  ];
};
const userResetForgetPasswordValidator = () => {
  return [
    body("newPassword").isEmpty().withMessage("new password is required"),
  ];
};

export {
  userRegisterValidation,
  userLoginValidation,
  userChangeCurrentPasswordValidator,
  userForgetPasswordValidator,
  userResetForgetPasswordValidator,
};
