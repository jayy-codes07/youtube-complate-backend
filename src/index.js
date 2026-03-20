// require("env").config()
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db/db.js";

dotenv.config({ path: "./.env" });
console.log("ENV:", process.env.MONGO_URL);

connectDB();
