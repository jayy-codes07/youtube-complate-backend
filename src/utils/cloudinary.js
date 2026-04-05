import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilepath) => {
  try {
    if (!localFilepath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilepath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilepath);
    console.log("there is error in file uploading ", error);
    return null;
  }
};

const deleteOnCloudinary = async (cloudinaryUrl, resourceType = "image") => {
  try {
    const publicId = cloudinaryUrl.split("/").pop().split(".")[0];
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`Deleted from Cloudinary: ${publicId}`);
    return response;
  } catch (error) {
    console.log("there is error in file deleting ", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
