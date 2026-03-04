import jwt from "jsonwebtoken";

import { ApiError } from "../utils/api-error.js";
import { asyncHandeler } from "../utils/async-handler.js";
import User from "../models/user.models.js";

export const VerifyJWT = asyncHandeler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers("Authorization").replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "unauthorized access ");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken -emailVerificationExpiry -forgetPasswordExpiry -forgetPaswordToken",
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Error in verifying access token", error);
  }
});
