import mongoose from "mongoose";

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error in connecting DB");
    console.log(error.message);
    process.exit(1);
  }
};

export default connectToDb;