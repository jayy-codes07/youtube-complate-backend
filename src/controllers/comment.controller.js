import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId, userid } = req.params;
  const { content } = req.body;

  if (!videoId?.trim()) {
    throw new ApiError(400, "provide video id ");
  }
  if (!userid?.trim()) {
    throw new ApiError(400, "provide User id for that login");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "there is no content to change");
  }
  const comment = await Comment.create({
    content: content?.trim(),
    video: videoId?.trim(),
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(500, "problem in creating new comment");
  }

  res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { videoId, userid, commentId } = req.params;
  const { content } = req.body;
  if (!videoId?.trim()) {
    throw new ApiError(400, "provide video id ");
  }
  if (!userid?.trim()) {
    throw new ApiError(400, "provide User id for that login");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "there is no content to change");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "there is no such comment exist");
  }

  if (!comment.owner.toString() === req.user._id.toString()) {
    throw new ApiError(400, "you are not allow to change in this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content?.trim(),
      },
    },
    { new: true }
  );
  if (!updatedComment) {
    throw new ApiError(500, "problem in updating new comment");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updating successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { videoId, commentId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "provide video id ");
  }

  const deleteComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });
  if (!deleteComment) {
    throw new ApiError(400, "there is no such comment exist");
  }
  res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
