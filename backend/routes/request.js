const express = require("express");
const router = express.Router();

const Request = require("../models/Request");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/auth");

// CREATE REQUEST
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            resource,
            event,
            requestingDepartment,
            date,
            startTime,
            endTime,
            message
        } = req.body;

        if (
            !resource ||
            !event ||
            !requestingDepartment ||
            !date ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message: "Please provide all required fields."
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: "End time must be later than start time."
            });
        }

        if (startTime < "08:00" || endTime > "16:00") {
            return res.status(400).json({
                message: "Booking time must be between 08:00 and 16:00."
            });
        }

        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                message: "User information not found."
            });
        }

        const newRequest = new Request({
            user: userId,
            resource,
            event,
            requestingDepartment,
            date: new Date(date),
            startTime,
            endTime,
            message: message || "",
            status: "pending"
        });

        await newRequest.save();

        const savedRequest = await Request.findById(newRequest._id)
            .populate("user", "name email department role")
            .populate("resource", "name type location capacity available")
            .populate("event", "name description date startTime endTime location")
            .populate("requestingDepartment", "name");

        res.status(201).json({
            message: "Resource request submitted successfully.",
            request: savedRequest
        });

    } catch (error) {
        console.error("Create request error:", error);

        res.status(500).json({
            message: "Server error while creating request."
        });
    }
});


// GET ALL REQUESTS
router.get("/", async (req, res) => {
    try {
        const requests = await Request.find()
            .populate("user", "name email department role")
            .populate("resource", "name type location capacity available")
            .populate("event", "name description date startTime endTime location")
            .populate("requestingDepartment", "name")
            .sort({ createdAt: -1 });

        res.json(requests);

    } catch (error) {
        console.error("Get requests error:", error);

        res.status(500).json({
            message: "Server error while fetching requests."
        });
    }
});


// APPROVE REQUEST
router.put("/:id/approve", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admins only."
            });
        }

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Request is already ${request.status}.`
            });
        }

        const existingBooking = await Booking.findOne({
            resource: request.resource,
            date: request.date,
            status: "confirmed",
            startTime: {
                $lt: request.endTime
            },
            endTime: {
                $gt: request.startTime
            }
        });

        if (existingBooking) {
            return res.status(409).json({
                message:
                    "Resource is already booked for this time. This request cannot be approved."
            });
        }

        const booking = new Booking({
            resource: request.resource,
            event: request.event,
            department: request.requestingDepartment,
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            status: "confirmed"
        });

        await booking.save();

        request.status = "approved";

        await request.save();

        const updatedRequest = await Request.findById(request._id)
            .populate("user", "name email department role")
            .populate("resource", "name type location capacity available")
            .populate("event", "name description date startTime endTime location")
            .populate("requestingDepartment", "name");

        res.json({
            message: "Request approved and booking confirmed.",
            request: updatedRequest,
            booking
        });

    } catch (error) {
        console.error("Approve request error:", error);

        res.status(500).json({
            message: "Server error while approving request."
        });
    }
});


// REJECT REQUEST
router.put("/:id/reject", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admins only."
            });
        }

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: `Request is already ${request.status}.`
            });
        }

        request.status = "rejected";

        await request.save();

        const updatedRequest = await Request.findById(request._id)
            .populate("user", "name email department role")
            .populate("resource", "name type location capacity available")
            .populate("event", "name description date startTime endTime location")
            .populate("requestingDepartment", "name");

        res.json({
            message: "Request rejected successfully.",
            request: updatedRequest
        });

    } catch (error) {
        console.error("Reject request error:", error);

        res.status(500).json({
            message: "Server error while rejecting request."
        });
    }
});


// DELETE REQUEST
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        await Request.findByIdAndDelete(req.params.id);

        res.json({
            message: "Request deleted successfully."
        });

    } catch (error) {
        console.error("Delete request error:", error);

        res.status(500).json({
            message: "Server error while deleting request."
        });
    }
});


module.exports = router;