require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jobRoutes = require("../../apps/api/src/routes/jobRouter.js");
mongoose.set("strictQuery",true); 

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () =>{
        console.log ("connect to db & listening on port",process.env.PORT);

    });
  })
  .catch((error) =>{
    console.log(error);
  }); 