// require("env").config()
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });
console.log("ENV:", process.env.MONGO_URL);

connectDB()
  .then(() => {
    app
      .listen(process.env.PORT, () => {
        console.log(`localhost port : ${process.env.PORT}`);
      })
      .on("error", (error) => {
        console.log("there is error => ", error);
        throw error;
      });
  })
  .catch((err) => {
    console.error("there is error", err);
  });
