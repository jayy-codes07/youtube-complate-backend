import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "please provide videoID");
  }

  const existvideo = await Video.exists({ _id: videoId });

  if (!existvideo) {
    throw new ApiError(400, "this video does not exist");
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ];
  const allcomments = await Comment.aggregate(pipeline);

  if (!allcomments.length) {
    throw new ApiError(400, "there is no comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allcomments, "all comments successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId) {
    throw new ApiError(400, "provide video id");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "valid videoId is required");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "content is required");
  }

  const videoExists = await Video.exists({ _id: videoId });

  if (!videoExists) {
    throw new ApiError(404, "video does not exist");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "something went wrong while adding comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "there is no content to add");
  }

  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user._id },
    {
      $set: {
        content: content.trim(),
      },
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(404, "something went wrong while updating comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updating successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "provide proper commentID");
  }
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(404, "comment does not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
