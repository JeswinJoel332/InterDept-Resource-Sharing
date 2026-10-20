const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();


// ==========================================
// CREATE BOOKING
// ==========================================
router.post("/", async (req, res) => {
    try {
        const {
            resource,
            event,
            department,
            date,
            startTime,
            endTime
        } = req.body;

        if (
            !resource ||
            !event ||
            !department ||
            !date ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message: "Please provide all required booking fields."
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: "End time must be later than start time."
            });
        }

        // Check for overlapping confirmed booking
        const existingBooking = await Booking.findOne({
            resource,
            date: new Date(date),
            status: "confirmed",
            startTime: {
                $lt: endTime
            },
            endTime: {
                $gt: startTime
            }
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "Resource is already booked for this time."
            });
        }

        const booking = await Booking.create({
            resource,
            event,
            department,
            date: new Date(date),
            startTime,
            endTime,
            status: "confirmed"
        });

        res.status(201).json({
            message: "Booking created successfully.",
            booking
        });

    } catch (error) {
        console.error("Create booking error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET ALL BOOKINGS
// ==========================================
router.get("/", async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("resource", "name type location capacity")
            .populate("event", "name description date startTime endTime location")
            .populate("department", "name code")
            .sort({ date: 1, startTime: 1 });

        res.json(bookings);

    } catch (error) {
        console.error("Get bookings error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET ONLY CONFIRMED BOOKINGS
// ==========================================
router.get("/confirmed", async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: "confirmed"
        })
            .populate("resource", "name type location capacity")
            .populate(
                "event",
                "name description date startTime endTime location"
            )
            .populate("department", "name code")
            .sort({ date: 1, startTime: 1 });

        res.json(bookings);

    } catch (error) {
        console.error("Get confirmed bookings error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET ONE BOOKING
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("resource", "name type location capacity")
            .populate(
                "event",
                "name description date startTime endTime location"
            )
            .populate("department", "name code");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json(booking);

    } catch (error) {
        console.error("Get booking error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// CANCEL BOOKING
// ==========================================
router.put("/:id/cancel", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                status: "cancelled"
            },
            {
                new: true
            }
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking cancelled successfully.",
            booking
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// DELETE BOOKING
// ==========================================
router.delete("/:id", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.json({
            message: "Booking deleted successfully."
        });

    } catch (error) {
        console.error("Delete booking error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;