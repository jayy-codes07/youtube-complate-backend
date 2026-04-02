import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  if (!req) {
    res.ApiError(400, "there is problem in api");
  }

  res.status(200).json(ApiResponse(200, {}, "api running perfectly fine"));
});

export { healthcheck };
