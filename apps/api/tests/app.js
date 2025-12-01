import express from "express";
import jobRouter from "./routes/jobRouter";

const app = express();
app.use(express.json());

app.use("/api/jobs", jobRouter);

export default app;
