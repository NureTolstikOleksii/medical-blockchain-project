import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { generateUserWalletAddress, registerDoctorOnChain } from "../utils/blockchainIdentity.service.js";
import { contract, adminWallet, provider } from "../config/blockchain.js";

export class AdminService {

    async registerDoctor(data) {
        const {
            email,
            password,
            full_name,
            specialization,
            experience_years,
            license_number,
        } = data;

        // 1. Валідація
        if (!email || !password || !full_name) {
            throw new Error("email, password і full_name — обов'язкові");
        }
        if (!specialization || !license_number) {
            throw new Error("specialization і license_number — обов'язкові");
        }

        // 2. Перевірка email
        const existing = await prisma.users.findUnique({ where: { email } });
        if (existing) {
            throw new Error("Користувач з таким email вже існує");
        }

        // 3. Генерація blockchain wallet
        const wallet = generateUserWalletAddress();

        // 4. Хеш пароля
        const password_hash = await bcrypt.hash(password, 10);

        // 5. Створюємо user в таблиці users
        const user = await prisma.users.create({
            data: {
                email,
                password_hash,
                full_name,
                role: "doctor",
                wallet,
            },
        });

        // 6. Створюємо профіль лікаря
        const profile = await prisma.doctor_profiles.create({
            data: {
                user_id: user.id,
                specialization,
                experience_years: experience_years ? Number(experience_years) : null,
                license_number,
            },
        });

        // 7. Реєструємо лікаря на блокчейні
        const tx = await registerDoctorOnChain(wallet);
        const receipt = await tx.wait();

        // 8. Пишемо подію в blockchain_events
        await prisma.blockchain_events.create({
            data: {
                tx_hash: receipt.hash,
                event_name: "DoctorRegistered",
                block_number: Number(receipt.blockNumber),
                payload: { wallet },
            },
        });

        return {
            message: "Doctor successfully registered",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                wallet: user.wallet,
                role: user.role,
            },
            profile,
        };
    }

    async getAuditHistory() {

        // 1. Отримуємо історію логінів
        const logs = await prisma.auth_logs.findMany({
            orderBy: { timestamp: "desc" },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        // 2. Отримуємо події з блокчейну
        const events = await prisma.blockchain_events.findMany({
            orderBy: { created_at: "desc" }
        });

        // 3. Формуємо відповідь
        return {
            auth_logs: logs.map(l => ({
                id: l.id,
                user: l.users
                    ? {
                        id: l.users.id,
                        full_name: l.users.full_name,
                        email: l.users.email,
                        role: l.users.role
                    }
                    : null,
                ip: l.ip,
                user_agent: l.user_agent,
                success: l.success,
                timestamp: l.timestamp
            })),

            blockchain_events: events.map(e => ({
                id: e.id,
                tx_hash: e.tx_hash,
                event_name: e.event_name,
                block_number: e.block_number,
                payload: e.payload,
                created_at: e.created_at
            }))
        };
    }

    async getAllDoctors() {
        const doctors = await prisma.users.findMany({
            where: { role: "doctor" },
            select: {
                id: true,
                email: true,
                full_name: true,
                wallet: true,
                created_at: true,
                is_active: true,
                doctor_profiles: {
                    select: {
                        specialization: true,
                        experience_years: true,
                        license_number: true,
                        updated_at: true
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });

        return {
            total: doctors.length,
            doctors
        };
    }

    async deactivateDoctor(id) {
        const doctor = await prisma.users.findUnique({
            where: { id: Number(id) }
        });

        if (!doctor) throw new Error("Лікаря не знайдено");
        if (doctor.role !== "doctor") throw new Error("Цей користувач не є лікарем");

        const updated = await prisma.users.update({
            where: { id: Number(id) },
            data: { is_active: false }
        });

        return {
            message: "Doctor deactivated",
            doctor: {
                id: updated.id,
                email: updated.email,
                full_name: updated.full_name,
                is_active: updated.is_active
            }
        };
    }

    async activateDoctor(id) {
        const doctor = await prisma.users.findUnique({
            where: { id: Number(id) }
        });

        if (!doctor) throw new Error("Лікаря не знайдено");
        if (doctor.role !== "doctor") throw new Error("Цей користувач не є лікарем");

        const updated = await prisma.users.update({
            where: { id: Number(id) },
            data: { is_active: true }
        });

        return {
            message: "Doctor activated",
            doctor: {
                id: updated.id,
                email: updated.email,
                full_name: updated.full_name,
                is_active: updated.is_active
            }
        };
    }

    async getAllPatients() {
        const patients = await prisma.users.findMany({
            where: {
                role: "patient"
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                wallet: true,
                created_at: true,
                is_active: true,
                patient_profiles: {
                    select: {
                        age: true,
                        gender: true,
                        allergies: true,
                        chronic_conditions: true,
                        updated_at: true
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });

        return {
            total: patients.length,
            patients
        };
    }

    async grantDoctorAccess(patientId, doctorId) {

        const patient = await prisma.users.findUnique({
            where: { id: Number(patientId) }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнта не знайдено");
        }

        const doctor = await prisma.users.findUnique({
            where: { id: Number(doctorId) }
        });

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Лікаря не знайдено");
        }

        const tx = await contract.setDoctorAccess(
            patient.wallet,
            doctor.wallet,
            true
        );
        const receipt = await tx.wait();

        await prisma.blockchain_events.create({
            data: {
                tx_hash: receipt.hash,
                event_name: "AccessGranted",
                block_number: Number(receipt.blockNumber),
                payload: {
                    patient_wallet: patient.wallet,
                    doctor_wallet: doctor.wallet,
                    allowed: true
                }
            }
        });

        return {
            message: "Access granted",
            patient: {
                id: patient.id,
                full_name: patient.full_name
            },
            doctor: {
                id: doctor.id,
                full_name: doctor.full_name
            }
        };
    }

    async revokeDoctorAccess(patientId, doctorId) {

        const patient = await prisma.users.findUnique({
            where: { id: Number(patientId) }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнта не знайдено");
        }

        const doctor = await prisma.users.findUnique({
            where: { id: Number(doctorId) }
        });

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Лікаря не знайдено");
        }

        const tx = await contract.setDoctorAccess(
            patient.wallet,
            doctor.wallet,
            false
        );
        const receipt = await tx.wait();

        await prisma.blockchain_events.create({
            data: {
                tx_hash: receipt.hash,
                event_name: "AccessRevoked",
                block_number: Number(receipt.blockNumber),
                payload: {
                    patient_wallet: patient.wallet,
                    doctor_wallet: doctor.wallet,
                    allowed: false
                }
            }
        });

        return {
            message: "Access revoked",
            patient: {
                id: patient.id,
                full_name: patient.full_name
            },
            doctor: {
                id: doctor.id,
                full_name: doctor.full_name
            }
        };
    }

    async checkDoctorAccess(doctorWallet, patientWallet) {

        // 1. Перевіряємо лікаря
        const doctor = await prisma.users.findUnique({
            where: { wallet: doctorWallet }
        });

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Доктора не знайдено");
        }

        // 2. Перевіряємо пацієнта
        const patient = await prisma.users.findUnique({
            where: { wallet: patientWallet }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнта не знайдено");
        }

        // 3. Викликаємо блокчейн
        const isDoctor = await contract.isDoctor(doctorWallet);
        const isPatient = await contract.isPatient(patientWallet);
        const hasAccess = await contract.patientToDoctorAccess(patientWallet, doctorWallet);

        return {
            doctor: {
                id: doctor.id,
                full_name: doctor.full_name,
                wallet: doctor.wallet,
                isDoctorOnChain: isDoctor
            },
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                wallet: patient.wallet,
                isPatientOnChain: isPatient
            },
            access: hasAccess
        };
    }
}

