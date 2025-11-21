const express = require("express");
const jobRouter = require("./routes/jobRouter");

const app = express();
app.use(express.json());

app.use("/api/jobs", jobRouter);

module.exports = app;
