import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import ipfs from "../config/ipfs.js";
import { contract, adminWallet, provider } from "../config/blockchain.js";
import { generateUserWalletAddress } from "../utils/blockchainIdentity.service.js";
import {getMLRecommendation} from "../utils/ml-data.service.js";

export class DoctorService {

    async registerPatient(doctorUser, data) {
        const {
            email,
            password,
            full_name,
            age,
            gender,
            allergies,
            chronic_conditions
        } = data;

        // 1. Перевірка лікаря
        if (!doctorUser || !doctorUser.id) {
            throw new Error("Не вдалося визначити лікаря");
        }

        const doctor = await prisma.users.findUnique({
            where: { id: doctorUser.id }
        });

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Користувач не є лікарем");
        }

        // 2. Перевірка даних пацієнта
        if (!email || !password || !full_name) {
            throw new Error("email, password і full_name — обов'язкові");
        }

        const existing = await prisma.users.findUnique({ where: { email } });
        if (existing) {
            throw new Error("Користувач з таким email вже існує");
        }

        // 3. Генеруємо гаманець пацієнта
        const wallet = generateUserWalletAddress();
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Створюємо user
        const user = await prisma.users.create({
            data: {
                email,
                password_hash,
                full_name,
                role: "patient",
                wallet,
            },
        });

        // 5. Створюємо профіль
        const profile = await prisma.patient_profiles.create({
            data: {
                user_id: user.id,
                age: age ? Number(age) : null,
                gender: gender || null,
                allergies: Array.isArray(allergies) ? allergies : [],
                chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : []
            },
        });

        // 6.ручне керування nonce
        let nonce = await provider.getTransactionCount(adminWallet.address, "pending");

        // Реєструємо пацієнта
        const txRegister = await contract.registerPatient(wallet, {
            nonce,
            gasLimit: 500000
        });
        const receiptRegister = await txRegister.wait();
        nonce++;

        // Даємо доступ лікарю
        const txAccess = await contract.setDoctorAccess(
            user.wallet,
            doctor.wallet,
            true,
            {
                nonce,
                gasLimit: 500000
            }
        );
        const receiptAccess = await txAccess.wait();

        // 7. Логування події у БД
        await prisma.blockchain_events.create({
            data: {
                tx_hash: receiptRegister.hash,
                event_name: "PatientRegistered",
                block_number: Number(receiptRegister.blockNumber),
                payload: { wallet: user.wallet },
            },
        });

        // 8. Відповідь
        return {
            message: "Patient successfully registered",
            accessGranted: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                wallet: user.wallet,
                role: user.role,
            },
            profile,
            blockchain: {
                patientRegisterTx: receiptRegister.hash,
                doctorAccessTx: receiptAccess.hash
            }
        };
    }

    async getAccessiblePatients(doctorId) {
        // 1. Знаходимо wallet лікаря
        const doctor = await prisma.users.findUnique({
            where: { id: doctorId },
            select: { wallet: true }
        });

        if (!doctor) {
            throw new Error("Doctor not found");
        }

        // 2. Отримуємо всіх пацієнтів з БД
        const patients = await prisma.users.findMany({
            where: { role: "patient" },
            select: {
                id: true,
                email: true,
                full_name: true,
                wallet: true,
                created_at: true,
                patient_profiles: true
            }
        });

        const doctorWallet = doctor.wallet;
        const accessible = [];

        // 3. Перевіряємо доступ через контракт
        for (const p of patients) {
            const hasAccess = await contract.patientToDoctorAccess(p.wallet, doctorWallet);

            if (hasAccess) {
                accessible.push(p);
            }
        }

        return accessible;
    }

    async createPrescription(currentUser, data, file) {
        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити лікаря");
        }

        const { patient_id, medication_name, dosage, schedule } = data;

        if (!patient_id) throw new Error("patient_id — обовʼязковий");
        if (!medication_name) throw new Error("medication_name — обовʼязковий");

        // 1. Лікар
        const doctor = await prisma.users.findUnique({
            where: { id: currentUser.id },
        });
        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Доктора не знайдено");
        }

        // 2. Пацієнт
        const patient = await prisma.users.findUnique({
            where: { id: Number(patient_id) },
        });
        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнта не знайдено");
        }

        // 3. Перевірка доступу
        const access = await contract.patientToDoctorAccess(patient.wallet, doctor.wallet);
        if (!access) throw new Error("У лікаря немає доступу до цього пацієнта");

        // 4. Завантаження файлу до IPFS
        let ipfs_hash = null;

        if (file) {
            const added = await ipfs.add(file.buffer);
            ipfs_hash = added.path; // Qm.... хеш

            await prisma.medical_files.create({
                data: {
                    patient_id: patient.id,
                    doctor_id: doctor.id,
                    ipfs_hash,
                    file_type: file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        size: file.size
                    }
                }
            });
        }

        // 5. Створюємо локальний запис призначення
        const localPrescription = await prisma.prescriptions_local.create({
            data: {
                patient_wallet: patient.wallet,
                doctor_wallet: doctor.wallet,
                medication_name,
                dosage,
                schedule,
                timestamp: new Date(),
                ipfs_hash
            },
        });

        // 6. Створюємо призначення в блокчейні
        const tx = await contract.addPrescriptionByRelayer(
            doctor.wallet,
            patient.wallet,
            medication_name,
            dosage || "",
            schedule || "",
            ipfs_hash || ""
        );
        const receipt = await tx.wait();

        // 7. Записуємо blockchain event
        await prisma.blockchain_events.create({
            data: {
                tx_hash: receipt.hash,
                event_name: "PrescriptionCreated",
                block_number: Number(receipt.blockNumber),
                payload: {
                    patient_wallet: patient.wallet,
                    doctor_wallet: doctor.wallet,
                    medication_name,
                },
            },
        });

        return {
            message: "Prescription created",
            prescription_id: localPrescription.id,
            ipfs_hash
        };
    }

    async getPatientPrescriptions(currentUser, patientId) {

        // 1. Перевіряємо лікаря
        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити лікаря");
        }

        const doctor = await prisma.users.findUnique({
            where: { id: currentUser.id }
        });

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Користувач не є лікарем");
        }

        // 2. Отримуємо пацієнта
        const patient = await prisma.users.findUnique({
            where: { id: Number(patientId) }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнта не знайдено");
        }

        // 3. Перевірка доступу
        const access = await contract.patientToDoctorAccess(patient.wallet, doctor.wallet);
        if (!access) {
            throw new Error("У лікаря немає доступу до цього пацієнта");
        }

        // 4. Отримуємо призначення з БД
        const prescriptions = await prisma.prescriptions_local.findMany({
            where: {
                patient_wallet: patient.wallet,
                doctor_wallet: doctor.wallet
            },
            orderBy: { timestamp: "desc" }
        });

        // 5. Формуємо відповідь
        return {
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                wallet: patient.wallet
            },
            prescriptions: prescriptions.map(p => ({
                id: p.id,
                medication_name: p.medication_name,
                dosage: p.dosage,
                schedule: p.schedule,
                timestamp: p.timestamp,
                ipfs_hash: p.ipfs_hash,
                ipfs_url: p.ipfs_hash ? `${process.env.PINATA_LINK}${p.ipfs_hash}` : null
            }))
        };
    }

    async getPatientRecommendations(patientId, currentUser) {

        if (!currentUser || currentUser.role !== "doctor") {
            throw new Error("Лише лікар може переглядати рекомендації");
        }

        const patient = await prisma.users.findUnique({
            where: { id: Number(patientId) }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Пацієнт не знайдений");
        }

        const mlResult = await getMLRecommendation(patient.id, "doctor");

        return {
            doctor: {
                id: currentUser.id,
                name: currentUser.full_name
            },
            patient: {
                id: patient.id,
                full_name: patient.full_name
            },
            recommendation: mlResult
        };
    }

    async getCurrentMeasurements(doctor, patientId) {

        // 1. Отримуємо всі вимірювання
        const measurements = await prisma.ml_measurements.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: "desc" }
        });

        // 2. Групуємо по типах і беремо останнє
        const latestByType = {};
        for (const m of measurements) {
            if (!latestByType[m.measurement_type]) {
                latestByType[m.measurement_type] = m;
            }
        }

        return latestByType;
    }

    async getMeasurementsHistory(doctor, patientId) {

        const history = await prisma.ml_measurements.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: "desc" }
        });

        return history;
    }

}
