import { Router } from "express";
import { LoginService } from "./login.service.js";

const router = Router();
const loginService = new LoginService();

router.post("/", async (req, res) => {
    try {
        const meta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"] || ""
        };

        const result = await loginService.login(req.body, meta);

        res.json(result);

    } catch (e) {
        console.error("Login error:", e.message);
        res.status(400).json({ error: e.message });
    }
});

export const loginRouter = router;
