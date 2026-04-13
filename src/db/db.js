import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectioninstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(
      `database is connected successfully  => ${connectioninstance.connection.host}`
    );
  } catch (error) {
    console.error("there is error in DB connection", error);
    throw error;
  }
};

export default connectDB;
