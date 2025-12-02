import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch {
        return res.status(403).json({ error: "Invalid token" });
    }
}

export function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
}

export function requireDoctor(req, res, next) {
    if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Doctor only" });
    }
    next();
}
