import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "name or description is missing");
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(500, "something went wrong while creating playlist");
  }
  res
    .status(201)
    .json(new ApiResponse(201, playlist, "playlist created successfully"));

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userid is invalid");
  }

  const userPlayList = await Playlist.find({ owner: userId });

  if (userPlayList.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "playlist is empty"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userPlayList, "here is complete user playlist"));

  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "is playlist id is not valid");
  }
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "playlist does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "here is playlist be that id"));
  //TODO: get playlist by id
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "provide proper playlistId and VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "no such video exist in database");
  }
  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user._id },
    { $push: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(
      500,
      "something went wrong while adding video in playlist "
    );
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "video added in playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "provide proper playlistId and VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "no such video exist in database");
  }
  const deletedPlaylistVideo = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user._id },
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!deletedPlaylistVideo) {
    throw new ApiError(
      400,
      "something went wroing while deleting playlist video"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedPlaylistVideo,
        "video deleted in playlist successfully"
      )
    );
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "provide proper playlistId");
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!deletedPlaylist) {
    throw new ApiError(400, "somwthing went wrong in deleting playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "playlist deleted successfully")
    );
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "provide proper playlistid");
  }
  if (!name.trim() || !description.trim()) {
    throw new ApiError(400, "provided name and description is empty");
  }
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user._id },
    { name: name, description: description },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "something went wrong in updating playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "detail of playlist updated successfully"
      )
    );

  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
