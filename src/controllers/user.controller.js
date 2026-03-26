import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "problem in token generating");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // create user object
  // in response remove password and refresh token
  // check that user is created or not
  //if yes then return response

  // get user details from frontend

  //  get data from body
  const { fullname, email, username, password } = await req.body;
  // validate that if not empty
  if ([fullname, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // check if already exist or not :- username,email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "this email or username is in already use");
  }

  // check for avatar and coverImage
  const avatarlocalpath = await req.files?.avatar?.[0]?.path;
  let coverImagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalpath = req.files.coverImage[0].path;
  }

  // if there is no avatar we will sent error
  if (!avatarlocalpath) {
    throw new ApiError(400, "Avatar is required");
  }

  // upload it to Cloudinary
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);

  // check that avatar is sent to Cloudinary or not
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  // insert user into database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // remove password and refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(user);

  // check that user is created or not
  if (!createdUser) {
    console.log("user is not created");
    throw new ApiError(500, "user in not created by server");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from body
  const { email, username, password } = req.body;
  // check user exist
  let trimUsername = username?.trim()?.toLowerCase();
  let trimEmail = email?.trim()?.toLowerCase();

  // check that field is not empty
  if ((!trimUsername && !trimEmail) || !password) {
    throw new ApiError(400, "fill both fields ");
  }

  const user = await User.findOne({
    $or: [{ username: trimUsername }, { email: trimEmail }],
  });

  if (!user) {
    throw new ApiError(404, "username or email does not exist");
  }

  // check password with mail
  const checkPassword = await user.isPasswordCorrect(password);
  if (!checkPassword) {
    throw new ApiError(400, "your credentials is incorrect");
  }

  // generate Access & refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);

  // sent by cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password -refereshtoken"
  );
  // login user

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user login successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized person");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "token is expired or used");
    }
    const { accessToken, newRefreshToken } = await generateTokens(user?._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: "newRefreshToken",
          },
          "AccessToken refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "there is error in refreshing token");
  }
});
export { registerUser, loginUser, logoutUser, refreshAccessToken };
