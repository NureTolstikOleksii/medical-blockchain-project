import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function PatientDetailsPage() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    // Форма
    const [medication, setMedication] = useState("");
    const [dosage, setDosage] = useState("");
    const [schedule, setSchedule] = useState("");
    const [file, setFile] = useState(null);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiError, setAiError] = useState("");

    const [measurements, setMeasurements] = useState([]);
    const [latestMeasurements, setLatestMeasurements] = useState({});
    const [measurementsError, setMeasurementsError] = useState("");

    const loadData = async () => {
        try {
            const res = await api.get(`/doctor/prescriptions/${id}`);
            setPatient(res.data.patient);
            setPrescriptions(res.data.prescriptions);

            // --- Нові запити ---
            const latestRes = await api.get(`/doctor/patient/${id}/measurements/current`);
            setLatestMeasurements(latestRes.data);

            const historyRes = await api.get(`/doctor/patient/${id}/measurements/history`);
            setMeasurements(historyRes.data);

        } catch (e) {
            setError(e.response?.data?.error || "Помилка завантаження");
            setMeasurementsError(e.response?.data?.error || "");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);

    const createPrescription = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const formData = new FormData();
            formData.append("patient_id", id);
            formData.append("medication_name", medication);
            formData.append("dosage", dosage);
            formData.append("schedule", schedule);
            if (file) formData.append("file", file);

            await api.post("/doctor/prescriptions", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            await loadData();

            setMedication("");
            setDosage("");
            setSchedule("");
            setFile(null);
        } catch (e) {
            setError(e.response?.data?.error || "Помилка створення призначення");
        }
    };

    const loadAI = async () => {
        setAiLoading(true);
        setAiError("");
        setAiData(null);

        try {
            const res = await api.get(`/doctor/patient/${id}/recommendations`);
            setAiData(res.data.recommendation);
            setAiModalOpen(true);
        } catch (e) {
            setAiError(e.response?.data?.error || "Не вдалося отримати аналітику");
        } finally {
            setAiLoading(false);
        }
    };


    if (loading) return <p>Завантаження...</p>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1>Пацієнт: {patient.full_name}</h1>
                    <p><b>Wallet:</b> <code>{patient.wallet}</code></p>
                </div>

                <button className="primary-btn" onClick={loadAI} disabled={aiLoading}>
                    {aiLoading ? "Завантаження..." : "Отримати AI аналітику"}
                </button>
            </div>

            {aiError && <p className="error-message">{aiError}</p>}

            <hr style={{ margin: "20px 0" }} />
            <h2>Нове призначення</h2>
            {/* --- Форма призначення --- */}
            <div className="card prescription-card">
                <h2 style={{ marginBottom: "20px" }}>Додавання</h2>
                <form className="form" onSubmit={createPrescription}>

                    <label>Назва препарату *</label>
                    <input
                        value={medication}
                        onChange={(e) => setMedication(e.target.value)}
                    />

                    <label>Дозування</label>
                    <input
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                    />

                    <label>Графік прийому</label>
                    <input
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                    />

                    <label>Файл (PDF, зображення)</label>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />

                    {error && <p className="error-message">{error}</p>}

                    <button className="primary-btn" type="submit">
                        Створити призначення
                    </button>
                </form>
            </div>

            <hr style={{ margin: "30px 0" }} />

            {/* --- Історія призначень --- */}
            <h2>Історія призначень</h2>

            <div className="card">
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Препарат</th>
                        <th>Дозування</th>
                        <th>Графік</th>
                        <th>Дата</th>
                        <th>Файл</th>
                    </tr>
                    </thead>

                    <tbody>
                    {prescriptions.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.medication_name}</td>
                            <td>{p.dosage || "—"}</td>
                            <td>{p.schedule || "—"}</td>
                            <td>{new Date(p.timestamp).toLocaleString()}</td>
                            <td>
                                {p.ipfs_url ? (
                                    <a href={p.ipfs_url} target="_blank">
                                        Відкрити файл
                                    </a>
                                ) : "—"}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {prescriptions.length === 0 && (
                    <p>Призначень ще немає.</p>
                )}
            </div>
            <hr style={{ margin: "30px 0" }} />
            <h2>Історія показників пацієнта</h2>

            <div className="card">

                {/* Поточні останні значення */}
                <h3>Останні вимірювання</h3>

                {Object.keys(latestMeasurements).length === 0 ? (
                    <p>Немає доступних вимірювань.</p>
                ) : (
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Тип вимірювання</th>
                            <th>Значення</th>
                            <th>Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.values(latestMeasurements).map((m) => (
                            <tr key={m.id}>
                                <td>{m.measurement_type}</td>
                                <td>{m.value}</td>
                                <td>{new Date(m.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                <hr style={{ margin: "20px 0" }} />

                {/* Повна історія */}
                <h3>Вся історія вимірювань</h3>

                {measurements.length === 0 ? (
                    <p>Історія вимірювань порожня.</p>
                ) : (
                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Тип</th>
                            <th>Значення</th>
                            <th>Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {measurements.map((m) => (
                            <tr key={m.id}>
                                <td>{m.id}</td>
                                <td>{m.measurement_type}</td>
                                <td>{m.value}</td>
                                <td>{new Date(m.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

            </div>

            {aiModalOpen && (
                <div className="modal-background">
                    <div className="modal ai-modal">
                        <h2>AI аналітика по пацієнту</h2>

                        {aiData ? (
                            <div className="ai-content">

                                {/* 1. Загальний стан */}
                                <h3>Стан пацієнта</h3>
                                <p>
                                    <b>Статус:</b> {aiData.state.state_label === "normal" && "Норма"}
                                    {aiData.state.state_label === "below" && "Погіршений стан"}
                                    {aiData.state.state_label === "warning" && "Потребує уваги"}
                                </p>

                                <p><b>Ймовірності класів:</b></p>
                                <ul>
                                    <li>Норма: {(aiData.state.probabilities[0] * 100).toFixed(1)}%</li>
                                    <li>Проміжний стан: {(aiData.state.probabilities[1] * 100).toFixed(1)}%</li>
                                    <li>Погіршений стан: {(aiData.state.probabilities[2] * 100).toFixed(1)}%</li>
                                </ul>

                                <p><b>Загальний ризиковий бал:</b> {(aiData.risk_score * 100).toFixed(2)}%</p>


                                {/*  2.Структуровані рекомендації */}
                                {aiData.structured_recommendations?.length > 0 && (
                                    <>
                                        <h3>Індивідуальні рекомендації</h3>

                                        <ul>
                                            {aiData.structured_recommendations.map((rec, i) => (
                                                <li key={i} style={{ marginBottom: "12px" }}>
                                                    <b>{rec.name}</b>
                                                    <br />
                                                    <span style={{ color: "#555" }}>
                                            Причина: {rec.reason}
                                        </span>
                                                    <br />
                                                    <span style={{ color: "#777" }}>
                                            Пріоритет: {rec.priority}
                                        </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {/* 3. AI текстовий звіт */}
                                <h3>Медичний висновок AI</h3>
                                <p style={{ whiteSpace: "pre-line" }}>
                                    {aiData.ai_text}
                                </p>

                            </div>
                        ) : (
                            <p>Дані недоступні.</p>
                        )}

                        <div className="modal-buttons">
                            <button className="secondary-btn" onClick={() => setAiModalOpen(false)}>
                                Закрити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
