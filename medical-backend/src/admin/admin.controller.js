import { Router } from "express";
import { AdminService } from "./admin.service.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const adminService = new AdminService();

router.post(
    "/register-doctor",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.registerDoctor(req.body);
            return res.status(201).json(result);
        } catch (e) {
            console.error("Admin register doctor error:", e.message);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/audit",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.getAuditHistory();
            return res.json(result);
        } catch (e) {
            console.error("Admin audit error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/doctors",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.getAllDoctors();
            return res.json(result);
        } catch (e) {
            console.error("Admin get doctors error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.patch(
    "/doctors/:id/deactivate",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.deactivateDoctor(req.params.id);
            return res.json(result);
        } catch (e) {
            console.error("Deactivate doctor error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.patch(
    "/doctors/:id/activate",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.activateDoctor(req.params.id);
            return res.json(result);
        } catch (e) {
            console.error("Activate doctor error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/patients",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await adminService.getAllPatients();
            return res.json(result);
        } catch (e) {
            console.error("Admin get patients error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.post(
    "/patients/:patientId/grant-access/:doctorId",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const { patientId, doctorId } = req.params;
            const result = await adminService.grantDoctorAccess(patientId, doctorId);
            return res.json(result);
        } catch (e) {
            console.error("Grant access error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.post(
    "/patients/:patientId/revoke-access/:doctorId",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const { patientId, doctorId } = req.params;
            const result = await adminService.revokeDoctorAccess(patientId, doctorId);
            return res.json(result);
        } catch (e) {
            console.error("Revoke access error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

router.get(
    "/access/check",
    requireAuth,
    requireAdmin,
    async (req, res) => {
        try {
            const { doctor, patient } = req.query;

            if (!doctor || !patient) {
                return res.status(400).json({ error: "Missing doctor or patient wallet" });
            }

            const result = await adminService.checkDoctorAccess(doctor, patient);
            return res.json(result);

        } catch (e) {
            console.error("Admin check access error:", e);
            return res.status(400).json({ error: e.message });
        }
    }
);

export const adminRouter = router;
