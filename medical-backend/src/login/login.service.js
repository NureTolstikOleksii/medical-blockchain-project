import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class LoginService {
    async login(data, meta) {
        const { email, password } = data;

        if (!email || !password) {
            throw new Error("email і password є обов'язковими");
        }

        const user = await prisma.users.findUnique({
            where: { email }
        });

        // Якщо Email не знайдено лог невдалої спроби
        if (!user) {
            await prisma.auth_logs.create({
                data: {
                    user_id: null,
                    ip: meta.ip,
                    user_agent: meta.userAgent,
                    success: false
                }
            });

            throw new Error("Користувача з таким email не існує");
        }

        if (!user.is_active) {
            throw new Error("Ваш акаунт деактивований адміністратором");
        }

        // Перевірка пароля
        const isValid = await bcrypt.compare(password, user.password_hash);

        // Невірний пароль лог невдалої спроби
        if (!isValid) {
            await prisma.auth_logs.create({
                data: {
                    user_id: user.id,
                    ip: meta.ip,
                    user_agent: meta.userAgent,
                    success: false
                }
            });

            throw new Error("Невірний пароль");
        }

        // Генерація JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Підтягуємо профіль
        let profile = null;

        if (user.role === "doctor") {
            profile = await prisma.doctor_profiles.findUnique({
                where: { user_id: user.id }
            });
        }

        if (user.role === "patient") {
            profile = await prisma.patient_profiles.findUnique({
                where: { user_id: user.id }
            });
        }

        // Успішний логін записуємо лог
        await prisma.auth_logs.create({
            data: {
                user_id: user.id,
                ip: meta.ip,
                user_agent: meta.userAgent,
                success: true
            }
        });

        // Видаляємо пароль
        const { password_hash, ...safeUser } = user;

        return {
            message: "Login successful",
            token,
            user: safeUser,
            profile,
            redirectRole: user.role
        };
    }
}
