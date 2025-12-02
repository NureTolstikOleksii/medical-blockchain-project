import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
    const email = "admin@example.com";

    const existing = await prisma.users.findUnique({ where: { email } });

    if (existing) {
        console.log("Admin already exists");
        return;
    }

    const adminWallet = process.env.ADMIN_WALLET;

    const hash = await bcrypt.hash("admin123", 10);

    const admin = await prisma.users.create({
        data: {
            email,
            password_hash: hash,
            full_name: "System Administrator",
            role: "admin",
            wallet: adminWallet
        }
    });

    console.log("Admin created:", admin);
}

main().finally(() => process.exit());
