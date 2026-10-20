const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/department");
const resourceRoutes = require("./routes/resource");
const eventRoutes = require("./routes/event");
const requestRoutes = require("./routes/request");
const bookingRoutes = require("./routes/booking");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
    res.send("Inter-Departmental Resource Sharing API is running");
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", err);
    });