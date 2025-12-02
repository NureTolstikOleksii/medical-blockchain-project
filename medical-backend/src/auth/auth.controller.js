import { Router } from 'express';
import { AuthService } from './auth.service.js';

const router = Router();
const authService = new AuthService();

router.post('/register',  async (req, res) => {
    try {
        const meta = {
            ip: req.ip,
            userAgent: req.headers['user-agent'] || '',
        };

        const result = await authService.register(req.body, meta);
        return res.status(201).json(result);
    } catch (e) {
        console.error('Register error:', e.message);
        return res.status(400).json({ error: e.message });
    }
});

export const authRouter = router;
