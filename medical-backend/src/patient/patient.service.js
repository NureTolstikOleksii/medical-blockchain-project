import prisma from "../config/prisma.js";
import {getMLRecommendation} from "../utils/ml-data.service.js";

export class PatientService {

    async getMyPrescriptions(currentUser) {

        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити пацієнта");
        }

        const patient = await prisma.users.findUnique({
            where: { id: currentUser.id }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Цей користувач не є пацієнтом");
        }

        const prescriptions = await prisma.prescriptions_local.findMany({
            where: {
                patient_wallet: patient.wallet
            },
            orderBy: { timestamp: "desc" }
        });

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

    async getPatientProfile(currentUser) {
        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити пацієнта");
        }

        const user = await prisma.users.findUnique({
            where: { id: currentUser.id },
            include: {
                patient_profiles: true
            }
        });

        if (!user || user.role !== "patient") {
            throw new Error("Користувач не є пацієнтом");
        }

        // Отримуємо кількість призначень
        const prescriptionsCount = await prisma.prescriptions_local.count({
            where: { patient_wallet: user.wallet }
        });

        // Останнє призначення
        const lastPrescription = await prisma.prescriptions_local.findFirst({
            where: { patient_wallet: user.wallet },
            orderBy: { timestamp: "desc" }
        });

        // Кількість медичних файлів
        const filesCount = await prisma.medical_files.count({
            where: { patient_id: user.id }
        });

        // Останній файл
        const lastFile = await prisma.medical_files.findFirst({
            where: { patient_id: user.id },
            orderBy: { created_at: "desc" }
        });

        // Формуємо фінальну структуру
        return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            wallet: user.wallet,

            profile: {
                age: user.patient_profiles?.age || null,
                gender: user.patient_profiles?.gender || null,
                allergies: user.patient_profiles?.allergies || [],
                chronic_conditions: user.patient_profiles?.chronic_conditions || [],
                updated_at: user.patient_profiles?.updated_at || null
            },

            stats: {
                prescriptions_total: prescriptionsCount,
                files_total: filesCount
            },

            last_prescription: lastPrescription ? {
                id: lastPrescription.id,
                medication_name: lastPrescription.medication_name,
                timestamp: lastPrescription.timestamp,
                ipfs_hash: lastPrescription.ipfs_hash,
                ipfs_url: lastPrescription.ipfs_hash
                    ? `${process.env.PINATA_LINK}${lastPrescription.ipfs_hash}`
                    : null
            } : null,

            last_file: lastFile ? {
                id: lastFile.id,
                file_type: lastFile.file_type,
                ipfs_hash: lastFile.ipfs_hash,
                url: `https://ipfs.io/ipfs/${lastFile.ipfs_hash}`,
                created_at: lastFile.created_at
            } : null
        };
    }

    async getPatientFiles(currentUser) {

        // Перевірка авторизації
        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити пацієнта");
        }

        // Отримуємо пацієнта
        const patient = await prisma.users.findUnique({
            where: { id: currentUser.id },
            include: {
                patient_profiles: true
            }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Користувач не є пацієнтом");
        }

        // Витягуємо файли з таблиці medical_files
        const files = await prisma.medical_files.findMany({
            where: { patient_id: patient.id },
            orderBy: { created_at: "desc" },
            include: {
                users_medical_files_doctor_idTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        wallet: true
                    }
                }
            }
        });

        return {
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                wallet: patient.wallet
            },
            files: files.map(f => ({
                id: f.id,
                file_type: f.file_type,
                created_at: f.created_at,
                ipfs_hash: f.ipfs_hash,
                metadata: f.metadata,
                ipfs_url: `${process.env.PINATA_LINK}${f.ipfs_hash}`,
                uploaded_by: f.users_medical_files_doctor_idTousers
                    ? {
                        id: f.users_medical_files_doctor_idTousers.id,
                        full_name: f.users_medical_files_doctor_idTousers.full_name,
                        wallet: f.users_medical_files_doctor_idTousers.wallet
                    }
                    : null
            }))
        };
    }

    async getPatientRecommendations(currentUser) {
        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити пацієнта");
        }

        const patient = await prisma.users.findUnique({
            where: { id: currentUser.id }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Користувач не є пацієнтом");
        }

        const mlResult = await getMLRecommendation(patient.id, "patient");

        return {
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                wallet: patient.wallet
            },
            recommendation: mlResult
        };
    }

    async getPatientMeasurements(currentUser) {

        if (!currentUser || !currentUser.id) {
            throw new Error("Не вдалося визначити пацієнта");
        }

        const patient = await prisma.users.findUnique({
            where: { id: currentUser.id }
        });

        if (!patient || patient.role !== "patient") {
            throw new Error("Користувач не є пацієнтом");
        }

        // Отримуємо всі медичні показники
        const measurements = await prisma.ml_measurements.findMany({
            where: { patient_id: patient.id },
            orderBy: { created_at: "desc" }
        });

        // Групуємо по типам
        const grouped = {};

        for (const m of measurements) {
            if (!grouped[m.measurement_type]) {
                grouped[m.measurement_type] = [];
            }
            grouped[m.measurement_type].push(m);
        }

        return {
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                wallet: patient.wallet
            },
            measurements: grouped,
            total: measurements.length
        };
    }

}
