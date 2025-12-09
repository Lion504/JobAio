import express from "express";
import cors from "cors";
import jobRouter from "./routes/jobRouter.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobRouter);

export default app;
