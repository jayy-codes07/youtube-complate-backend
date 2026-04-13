import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  let videos = [];

  if (query) {
    videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
    if (!videos || videos.length === 0) {
      throw new ApiError(400, "there is no such video exist");
    }
    if (userId) {
      videos = videos.filter((vid) => vid.owner.toString() === userId);
    }
    videos = videos.filter((vid) => vid.isPublished === true);
  } else {
    videos = await Video.find({ isPublished: true });
  }

  if (userId) {
    videos = videos.filter((vid) => vid.owner.toString() === userId);
  }

  if (sortBy && sortType) {
    videos = videos.sort((a, b) => {
      if (sortType === "desc") {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      }
    });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedVideos = videos.slice(startIndex, endIndex);
  res
    .status(200)
    .json(new ApiResponse(200, paginatedVideos, "those are videos "));
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "title or description is missing");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video file or thumbnail is missing");
  }

  const [videoFile, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoFileLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  if (!videoFile?.url || !thumbnail?.url) {
    throw new ApiError(500, "problem in uploading files to cloudinary");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration ?? 0,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "VideoID is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "there is no such video exist in DB");
  }

  res.status(200).json(new ApiResponse(200, video, "here is video sent"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!title?.trim() && !description?.trim() && !thumbnailLocalPath?.trim()) {
    throw new ApiError(
      400,
      "enter title and description and thumbnail properly"
    );
  }
  let thumbnail = null;
  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(500, "problem in uploading thumbnail to cloudinary ");
    }
  }

  const video = await Video.findOneAndUpdate(
    { _id: videoId, owner: req.user?._id },
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail?.url,
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "problem in uploading to database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details updated successfully"));
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "VideoID is required");
  }
  const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
  if (!video) {
    throw new ApiError(400, "this video does not exist in database");
  }
  const CloudinaryThumbnail = video.thumbnail;
  const CloudinaryVideoFile = video.videoFile;

  if (CloudinaryThumbnail) {
    await deleteOnCloudinary(CloudinaryThumbnail, "image");
  }

  if (CloudinaryVideoFile) {
    await deleteOnCloudinary(CloudinaryVideoFile, "video");
  }

  await Video.findOneAndDelete({ _id: videoId, owner: req.user?._id });

  res
    .status(200)
    .json(new ApiResponse(200, video, "video deleted SuccessFully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "videoId is required");
  }
  // const video = await Video.findByIdAndUpdate(videoId, $set : { isPublished: isPublished }, { new: true })
  const video = await Video.findOne({ _id: videoId, owner: req.user?._id });

  if (!video) {
    throw new ApiError(400, "there is no such video in database");
  }
  let videoPublished = video.isPublished;
  videoPublished = !videoPublished;

  const UpdatedVideo = await Video.findOneAndUpdate(
    { _id: videoId, owner: req.user?._id },
    { $set: { isPublished: videoPublished } },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, UpdatedVideo, "changed in video publishen"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
