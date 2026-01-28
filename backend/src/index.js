import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./db/db.js";
dotenv.config();

const PORT = process.env.PORT || 300;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is runnign at port new ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MonogoDB connection Error");
    process.exit(1);
  });
