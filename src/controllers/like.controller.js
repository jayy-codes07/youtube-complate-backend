import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "valid videoId is required");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video does not exist");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  let videoLike = undefined;
  if (!existingLike) {
    videoLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  } else {
    videoLike = await Like.findByIdAndDelete(existingLike._id);
  }

  if (!videoLike) {
    throw new ApiError(500, "something went wrong while creating like ");
  }

  const message = existingLike
    ? "video unliked successfully"
    : "video Liked SuccessFully";
  res.status(200).json(new ApiResponse(200, videoLike, message));
  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "valid commentId is required");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment does not exist");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  let commentLike = undefined;
  if (!existingLike) {
    commentLike = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  } else {
    commentLike = await Like.findByIdAndDelete(existingLike._id);
  }

  if (!commentLike) {
    throw new ApiError(500, "something went wrong while creating like ");
  }

  const message = existingLike
    ? "comment unliked successfully"
    : "comment Liked SuccessFully";
  res.status(200).json(new ApiResponse(200, commentLike, message));

  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet does not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "there is no such tweet exists in database");
  }

  let tweetLike = undefined;

  const existingLike = await Like.findOne({
    likedBy: req.user._id,
    tweet: tweetId,
  });

  if (!existingLike) {
    tweetLike = await Like.create({
      likedBy: req.user._id,
      tweet: tweetId,
    });
  } else {
    tweetLike = await Like.findByIdAndDelete(existingLike._id);
  }
  if (!tweetLike) {
    throw new ApiError(500, "something went wrong while creating like ");
  }

  const message = existingLike
    ? "tweet unliked successfully"
    : "tweet Liked SuccessFully";
  res.status(200).json(new ApiResponse(200, tweetLike, message));

  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userid = req.user._id;

  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userid),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    { $unwind: "$videoDetails" },
    {
      $lookup: {
        from: "users",
        localField: "videoDetails.owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },

    // { $addFields: { totalLikes: { $size: "$likes" }, isOwner: true } },

    {
      $project: {
        "videoDetails.title": 1,
        "videoDetails.views": 1,
        "videoDetails.duration": 1,
        "videoDetails.thumbnail": 1,
        "ownerDetails.username": 1,
        "ownerDetails.avatar": 1,
      },
    },
  ]);

  if (!videos) {
    throw new ApiError(400, "there is problem in getting liked videos");
  }
  if (videos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "you have not liked any videos"));
  }
  res
    .status(200)
    .json(new ApiResponse(200, videos, "all liked videos get successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
