const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");


const placeRoutes = require("./routes/place_routes");
const userRoutes = require("./routes/user_routes");
const appController = require("./controller/app");

const app = express();


app.use(cors());
// this helps to get the body of the request in json format and make it available in req.body
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    next();
})


app.use('/api/places', placeRoutes);  
app.use('/api/users', userRoutes);


app.use(appController.appRouteErrorHandler);
app.use((error, req, res, next) => {
    if (req.file?.path) {
        fs.unlink(req.file.path, err => {
            if (err) {
                console.error("Failed to delete uploaded file:", err);
            }
        });
    }

    if (res.headersSent) {
        return next(error);
    }

    res.status(error.code || 500).json({ message: error.message || "An unknown error occurred." });
});

console.log("Server running on http://localhost:5000");


// mongodb+srv://estif_01:Hanna0111atG@cluster0.90rbe5m.mongodb.net/?appName=Cluster0
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.90rbe5m.mongodb.net/?appName=${process.env.DB_NAME}`)
.then(
    () => {
        console.log("****Connected to MongoDB****");
        app.listen(process.env.PORT || 5000);
    }
).catch(err => {
    console.log("Failed to connect to MongoDB:", err);
});