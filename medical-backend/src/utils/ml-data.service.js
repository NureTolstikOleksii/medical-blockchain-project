import axios from "axios";
import prisma from "../config/prisma.js";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000/recommend-health";

export async function getMLRecommendation(patientId, mode = "patient") {
    try {
        const patient = await prisma.users.findUnique({
            where: { id: patientId },
            include: { patient_profiles: true }
        });

        if (!patient || !patient.patient_profiles) {
            throw new Error("Пацієнт не має профілю");
        }

        const measurements = await prisma.ml_measurements.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: "desc" },
            take: 20
        });

        const payload = {
            profile: {
                age: patient.patient_profiles.age,
                gender: patient.patient_profiles.gender,
                allergies: patient.patient_profiles.allergies,
                chronic_conditions: patient.patient_profiles.chronic_conditions
            },
            measurements: measurements.map(m => ({
                measurement_type: m.measurement_type,
                value: Number(m.value)
            })),
            files: [],
            prescriptions: []
        };

        const response = await axios.post(`${ML_URL}?mode=${mode}`, payload);
        const mlResult = response.data;

        // Save only for doctor mode
        if (mode === "doctor") {
            await prisma.ml_predictions.create({
                data: {
                    patient_id: patientId,
                    model_name: "hybrid-ml-ai-v1",
                    prediction: mlResult
                }
            });
        }

        return mlResult;

    } catch (err) {
        console.error("ML SERVICE ERROR:", err);
        return null;
    }
}
