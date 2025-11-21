const express = require("express");
const cors = require("cors");
const jobRouter = require("./routes/jobRouter");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobRouter);

module.exports = app;
