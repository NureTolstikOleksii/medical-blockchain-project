import { Router } from "express";
import { PatientService } from "./patient.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();
const patientService = new PatientService();

router.get(
    "/prescriptions",
    requireAuth,
    async (req, res) => {
        try {
            const result = await patientService.getMyPrescriptions(req.user);
            return res.json(result);
        } catch (e) {
            console.error("Get patient prescriptions error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/profile",
    requireAuth,
    async (req, res) => {
        try {
            const result = await patientService.getPatientProfile(req.user);
            return res.json(result);
        } catch (e) {
            console.error("Get patient profile error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/files",
    requireAuth,
    async (req, res) => {
        try {
            const result = await patientService.getPatientFiles(req.user);

            return res.json(result);
        } catch (e) {
            console.error("Get patient files error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/recommendations",
    requireAuth,
    async (req, res) => {
        try {
            const result = await patientService.getPatientRecommendations(req.user);
            return res.json(result);
        } catch (e) {
            console.error("Get patient recommendations error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/measurements",
    requireAuth,
    async (req, res) => {
        try {
            const result = await patientService.getPatientMeasurements(req.user);
            return res.json(result);
        } catch (e) {
            console.error("Get patient measurements error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

export const patientRouter = router;
