import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateUserWalletAddress } from '../utils/blockchainIdentity.service.js';
import { contract } from '../config/blockchain.js';

const VALID_ROLES = ['patient', 'doctor'];

export class AuthService {

    async register(data, meta) {
        const { email, password, full_name, role } = data;

        if (!email || !password || !role) {
            throw new Error('email, password і role є обовʼязковими');
        }

        if (!VALID_ROLES.includes(role)) {
            throw new Error('Неприпустима роль. Дозволено: patient, doctor');
        }

        // 1. Перевіряємо, чи немає вже такого email
        const existing = await prisma.users.findUnique({ where: { email } });
        if (existing) {
            throw new Error('Користувач з таким email вже існує');
        }

        // 2. Генеруємо wallet
        const wallet = generateUserWalletAddress();

        // 3. Хеш пароля
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Створюємо користувача в БД
        const user = await prisma.users.create({
            data: {
                email,
                password_hash,
                full_name,
                role,
                wallet,
            },
        });

        // 5. Реєструємо в блокчейні
        let tx;
        if (role === 'patient') {
            tx = await contract.registerPatient(wallet);
        } else if (role === 'doctor') {
            tx = await contract.registerDoctor(wallet);
        }

        const receipt = await tx.wait();

        // 6. Записуємо подію в blockchain_events (мінімально)
        await prisma.blockchain_events.create({
            data: {
                tx_hash: receipt.hash,
                event_name: role === 'patient' ? 'PatientRegistered' : 'DoctorRegistered',
                block_number: Number(receipt.blockNumber),
                payload: {},
            },
        });

        // 7. Лог авторизації (успішна реєстрація)
        await prisma.auth_logs.create({
            data: {
                user_id: user.id,
                ip: meta.ip,
                user_agent: meta.userAgent,
                success: true,
            },
        });

        // 8. Генеруємо JWT, якщо хочеш логінити одразу після реєстрації
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '7d' },
        );

        // Не віддаємо password_hash
        const { password_hash: _, ...safeUser } = user;

        return { user: safeUser, token };
    }

}
