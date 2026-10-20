const express = require("express");
const Resource = require("../models/Resource");

const router = express.Router();

// Add resource
router.post("/", async (req, res) => {
    try {
        const resource = await Resource.create(req.body);

        res.status(201).json({
            message: "Resource created successfully",
            resource
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all resources
router.get("/", async (req, res) => {
    try {
        const resources = await Resource.find()
            .populate("department", "name code");

        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get one resource
router.get("/:id", async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate("department", "name code");

        if (!resource) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update availability
router.put("/:id/availability", async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            { available: req.body.available },
            { new: true }
        );

        res.json({
            message: "Availability updated",
            resource
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete resource
router.delete("/:id", async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);

        res.json({
            message: "Resource deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;