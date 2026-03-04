import { ApiResponse } from "../utils/api-response.js";
import { asyncHandeler } from "../utils/async-handler.js";

const healthCheck = asyncHandeler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "Server is Runnig" }));
});

export { healthCheck };
