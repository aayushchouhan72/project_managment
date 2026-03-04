import jwt from "jsonwebtoken";

import User from "../models/user.models.js";
import { asyncHandeler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { forgotPasswordMailContent, sendEmail } from "../utils/mail.js";
import { emailVerificationMailContent } from "../utils/mail.js";
const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "somthing went wrong while genrating  access and refresh token",
      [],
    );
  }
};
//  SignUp or Regsiter User
const registerUser = asyncHandeler(async (req, res) => {
  const { email, username, password, role } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User With email or username  already exist ", []);
  }

  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  const { unHasedToken, hashedToken, tokenExpiry } =
    user.genrateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "please verify your email ",
    mailgenContent: emailVerificationMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHasedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationExpiry -forgetPasswordExpiry -forgetPaswordToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "somthing went wrong while creating user", []);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User Created SuccessFully and verification email is sent to your Email Address",
      ),
    );
});
//  Login User
const loginUser = asyncHandeler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Please Provide username or email to login", []);
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found with this email or username", []);
  }
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid password", []);
  }

  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationExpiry -forgetPasswordExpiry -forgetPaswordToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User is logged in successfully",
      ),
    );
});
//  LogOut user
const logoutUser = asyncHandeler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User is logged out successfully"));
});
//  Get Current User
const getCurrentUser = asyncHandeler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});
//  Email verification
const verifyEmail = asyncHandeler(async (req, res) => {
  const { verficationToken } = req.params;

  if (!verficationToken) {
    throw new ApiError(400, "Plese provide a valid token", []);
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verficationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token", []);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Email is verifies sucessfully"));
});
//  Resend Email verification token
const resendEmailVerificationToken = asyncHandeler(async (req, res) => {
  const user = await User.findById(req?.user._id);
  if (!user) {
    throw new ApiError(404, "user not found");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "User us already verified");
  }

  const { unHasedToken, hashedToken, tokenExpiry } =
    user.genrateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "please verify your email ",
    mailgenContent: emailVerificationMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHasedToken}`,
    ),
  });

  return res.status(200).json(new ApiResponse(200, null));
});
//  Refresh Acess Token
const refreshAccessToken = asyncHandeler(async (req, res) => {
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshtoken;

  if (!inComingRefreshToken) {
    throw new ApiError(
      401,
      "unauthorized access, refresh token is missing",
      [],
    );
  }

  try {
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findOne(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token", []);
    }
    if (user.refreshToken !== inComingRefreshToken) {
      throw new ApiError(401, "Refresh Token is Expired", []);
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
      user._id,
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token is refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong in the refresh access token route",
      error,
    );
  }
});
//  Forget password request handler;
const forgetPasswordRequestHandler = asyncHandeler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found with this email", []);
  }

  const { unHasedToken, hashedToken, tokenExpiry } =
    user.genrateTemporaryToken();

  user.forgetPaswordToken = hashedToken;
  user.forgetPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });
  await sendEmail({
    email: user?.email,
    subject: "Forget password request",
    mailgenContent: forgotPasswordMailContent(
      user.username,
      `${process.env.FORGET_PASSWORD_REDIRECT_URL}/${unHasedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Forget password email sent successfully"));
});
//  Reset forget password handler
const resetForgetPasswordHandler = asyncHandeler(async (req, res) => {
  const { resetToken } = req.params;
  const { newpassword } = req.body;

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgetPaswordToken: hashedToken,
    forgetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or Expired Token", []);
  }

  user.forgetPasswordExpiry = undefined;
  user.forgetPaswordToken = undefined;

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Reset password Successfully"));
});
//  Change password Handler
const changePasswordHandler = asyncHandeler(async (req, res) => {
  const { oldPassword, newpassword } = req.body;

  const user = user.findById(req.user._id);
  const isPasswordMatch = await user.comparePassword(oldPassword);

  if (!isPasswordMatch) {
    throw new ApiError(400, "Current password is incorrect", []);
  }
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is changed successfully"));
});

export {
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
};
