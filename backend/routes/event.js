const express = require("express");
const Event = require("../models/Event");

const router = express.Router();

// Create event
router.post("/", async (req, res) => {
    try {
        const event = await Event.create(req.body);

        res.status(201).json({
            message: "Event created successfully",
            event
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Get all events
router.get("/", async (req, res) => {
    try {
        const events = await Event.find()
            .populate("department", "name code");

        res.json(events);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Approve event
router.put("/:id/approve", async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            message: "Event approved successfully",
            event
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Get one event
router.get("/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate("department", "name code");

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Delete event
router.delete("/:id", async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);

        res.json({
            message: "Event deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;