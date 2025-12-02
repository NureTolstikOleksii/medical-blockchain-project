import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function PatientPrescriptionsPage() {

    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // AI recommendations
    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiError, setAiError] = useState("");

    const loadData = async () => {
        try {
            const res = await api.get("/patient/prescriptions");

            console.log("Prescriptions response:", res.data);

            setPatient(res.data.patient);
            setPrescriptions(res.data.prescriptions);

        } catch (e) {
            setError(e.response?.data?.error || "Помилка завантаження призначень");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // AI РЕКОМЕНДАЦІЇ
    const loadAI = async () => {
        setAiLoading(true);
        setAiError("");
        setAiData(null);

        try {
            const res = await api.get("/patient/recommendations");
            console.log("AI Recommendation:", res.data);

            setAiData(res.data.recommendation);
            setAiModalOpen(true);

        } catch (e) {
            setAiError(e.response?.data?.error || "Не вдалося отримати рекомендації");
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) return <p>Завантаження...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Мої призначення</h1>

                <button className="primary-btn" onClick={loadAI} disabled={aiLoading}>
                    {aiLoading ? "Завантаження..." : "Отримати рекомендації"}
                </button>
            </div>

            <hr style={{ margin: "30px 0" }} />

            {/* Історія призначень */}
            <h2>Історія призначень</h2>

            <div className="card">
                {prescriptions.length === 0 ? (
                    <p>Призначень ще немає.</p>
                ) : (
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
                                        <a href={p.ipfs_url} target="_blank" rel="noopener noreferrer">
                                            Відкрити
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* AI РЕКОМЕНДАЦІЇ — МОДАЛЬНЕ ВІКНО */}
            {aiModalOpen && (
                <div className="modal-background">
                    <div className="modal ai-modal">
                        <h2>AI Рекомендації</h2>

                        {aiError && <p className="error-message">{aiError}</p>}

                        {aiData ? (
                            <div className="ai-content">

                                {/* Кольоровий індикатор */}
                                <p>
                                    <b>Індикатор стану:</b>{" "}
                                    <span
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            background:
                                                aiData.indicator === "green"
                                                    ? "#d4f8d4"
                                                    : aiData.indicator === "yellow"
                                                        ? "#fff6c4"
                                                        : "#ffd4d4",
                                            color:
                                                aiData.indicator === "green"
                                                    ? "#0a7d0a"
                                                    : aiData.indicator === "yellow"
                                                        ? "#8a6d00"
                                                        : "#a20000",
                                        }}
                                    >
                                        {aiData.indicator === "green" && "Добрий стан"}
                                        {aiData.indicator === "yellow" && "Потребує уваги"}
                                        {aiData.indicator === "red" && "Погіршений стан"}
                                    </span>
                                </p>

                                <h3>Персональні рекомендації</h3>
                                <p style={{ whiteSpace: "pre-line" }}>
                                    {aiData.ai_text}
                                </p>
                            </div>
                        ) : (
                            <p>Немає даних.</p>
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
