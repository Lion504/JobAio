import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jobRoutes from "../../apps/api/src/routes/jobRouter.js";

mongoose.set("strictQuery", true);

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/api/jobs", jobRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Connected to DB & listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error(error);
  });
