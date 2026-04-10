import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // const {  } = req.params
  //    TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const channelId = req.user?._id;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(401, "unauthorized request");
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { owner: channelId, isPublished: true };

  const [videos, totalVideos] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Video.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          totalVideos,
          totalPages: Math.ceil(totalVideos / parsedLimit),
        },
      },
      "channel videos fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos };
