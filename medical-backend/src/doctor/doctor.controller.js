import { Router } from "express";
import { DoctorService } from "./doctor.service.js";
import { requireAuth, requireDoctor } from "../middlewares/auth.middleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();
const doctorService = new DoctorService();

router.post(
    "/register-patient",
    requireAuth,
    requireDoctor,
    async (req, res) => {
        try {
            const result = await doctorService.registerPatient(req.user, req.body);
            return res.status(201).json(result);
        } catch (e) {
            console.error("Doctor register patient error:", e.message);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/patients",
    requireAuth,
    requireDoctor,
    async (req, res) => {
        try {
            const patients = await doctorService.getAccessiblePatients(req.user.id);
            return res.json(patients);
        } catch (e) {
            console.error("Get patients error:", e.message);
            return res.status(500).json({ error: "Server error" });
        }
    }
);

router.post(
    "/prescriptions",
    requireAuth,
    requireDoctor,
    upload.single("file"),
    async (req, res) => {
        try {
            const result = await doctorService.createPrescription(
                req.user,
                req.body,
                req.file
            );

            return res.status(201).json(result);
        } catch (e) {
            console.error("Create prescription error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/prescriptions/:patientId",
    requireAuth,
    requireDoctor,
    async (req, res) => {
        try {
            const result = await doctorService.getPatientPrescriptions(
                req.user,
                req.params.patientId
            );

            return res.json(result);
        } catch (e) {
            console.error("Get patient prescriptions error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/patient/:id/recommendations",
    requireAuth,
    async (req, res) => {
        try {
            const result = await doctorService.getPatientRecommendations(req.params.id, req.user);
            return res.json(result);
        } catch (e) {
            console.error("Doctor get patient recommendations error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/patient/:id/measurements/current",
    requireAuth,
    requireDoctor,
    async (req, res) => {
        try {
            const result = await doctorService.getCurrentMeasurements(
                req.user,
                Number(req.params.id)
            );

            return res.json(result);
        } catch (e) {
            console.error("Get current measurements error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/patient/:id/measurements/history",
    requireAuth,
    requireDoctor,
    async (req, res) => {
        try {
            const result = await doctorService.getMeasurementsHistory(
                req.user,
                Number(req.params.id)
            );

            return res.json(result);
        } catch (e) {
            console.error("Get measurements history error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

export const doctorRouter = router;
