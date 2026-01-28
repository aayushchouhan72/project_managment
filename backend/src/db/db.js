import monogoose from "mongoose";

const connectDB = async () => {
  try {
    await monogoose.connect(process.env.MONGO_URI);
    console.log("✅ DB is connected succesfully");
  } catch (error) {
    console.error("MongoDB connection Error", error);
    process.exit(1);
  }
};

export default connectDB;
