import express from "express";
import { appointmentReminder } from "../data/pet.js";
import { invokeDB } from "../data/user.js";

const router = express.Router();

router.route("/appointment-reminder").get(async (req, res) => {
    try {
        if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await appointmentReminder();
        res.status(200).json({ message: "Cron job executed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.route("/invoke-db").get(async (req, res) => {
    try {
        if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await invokeDB();
        res.status(200).json({ message: "DB invoked successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
