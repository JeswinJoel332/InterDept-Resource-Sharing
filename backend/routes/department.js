const express = require("express");
const Department = require("../models/Department");

const router = express.Router();

// Add department
router.post("/", async (req, res) => {
    try {
        const { name, code, description } = req.body;

        const department = await Department.create({
            name,
            code,
            description
        });

        res.status(201).json({
            message: "Department created successfully",
            department
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all departments
router.get("/", async (req, res) => {
    try {
        const departments = await Department.find();

        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get one department
router.get("/:id", async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        res.json(department);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete department
router.delete("/:id", async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);

        res.json({
            message: "Department deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;