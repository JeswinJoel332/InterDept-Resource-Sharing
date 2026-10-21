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

// Root route
app.get("/", (req, res) => {
    res.send("Inter-Departmental Resource Sharing API is running");
});

// Cache the MongoDB connection for serverless invocations
let cachedConnection = null;
let connectionPromise = null;

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                cachedConnection = mongoose.connection;
                console.log("MongoDB connected successfully");
                return cachedConnection;
            })
            .catch((error) => {
                connectionPromise = null;
                throw error;
            });
    }

    return connectionPromise;
}

// Connect to the database before handling API requests
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        res.status(503).json({
            message: "Database connection unavailable"
        });
    }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bookings", bookingRoutes);

// Export the Express app for Vercel
module.exports = app;