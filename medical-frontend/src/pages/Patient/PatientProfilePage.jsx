import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function PatientProfilePage() {

    const [patient, setPatient] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            const res = await api.get("/patient/profile");

            console.log("API response:", res.data);

            setPatient(res.data);

            // бекенд повертає тільки last_file
            setFiles(res.data.last_file ? [res.data.last_file] : []);

        } catch (e) {
            setError(e.response?.data?.error || "Помилка завантаження профілю");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <p>Завантаження...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!patient) return <p>Не вдалося отримати дані профілю.</p>;

    const { profile, stats, last_prescription, last_file } = patient;

    return (
        <div>

            <h1>Мій профіль</h1>
            <hr style={{ margin: "30px 0" }} />

            {/* ========== ОСНОВНА ІНФОРМАЦІЯ ========== */}
            <div className="card" style={{ maxWidth: "650px" }}>
                <h2 style={{ marginBottom: "20px" }}>Особисті дані</h2>

                <table className="table">
                    <tbody>
                    <tr>
                        <td><b>ID</b></td>
                        <td>{patient.id}</td>
                    </tr>

                    <tr>
                        <td><b>ПІБ</b></td>
                        <td>{patient.full_name}</td>
                    </tr>

                    <tr>
                        <td><b>Email</b></td>
                        <td>{patient.email}</td>
                    </tr>

                    <tr>
                        <td><b>Wallet</b></td>
                        <td><code>{patient.wallet}</code></td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <hr style={{ margin: "30px 0" }} />
            <h2>Медичний профіль</h2>

            <div className="card" style={{ maxWidth: "650px" }}>
                {!profile ? (
                    <p>Профіль пацієнта відсутній.</p>
                ) : (
                    <table className="table">
                        <tbody>
                        <tr>
                            <td><b>Вік</b></td>
                            <td>{profile.age}</td>
                        </tr>

                        <tr>
                            <td><b>Стать</b></td>
                            <td>{profile.gender}</td>
                        </tr>

                        <tr>
                            <td><b>Алергії</b></td>
                            <td>{profile.allergies?.length > 0 ? profile.allergies.join(", ") : "—"}</td>
                        </tr>

                        <tr>
                            <td><b>Хронічні хвороби</b></td>
                            <td>{profile.chronic_conditions?.length > 0 ? profile.chronic_conditions.join(", ") : "—"}</td>
                        </tr>

                        <tr>
                            <td><b>Оновлено</b></td>
                            <td>{new Date(profile.updated_at).toLocaleString()}</td>
                        </tr>
                        </tbody>
                    </table>
                )}
            </div>



            {/*  СТАТИСТИКА */}
            <hr style={{ margin: "30px 0" }} />
            <h2>Статистика</h2>

            <div className="card" style={{ maxWidth: "450px" }}>
                <table className="table">
                    <tbody>
                    <tr>
                        <td><b>Всього призначень</b></td>
                        <td>{stats?.prescriptions_total}</td>
                    </tr>
                    <tr>
                        <td><b>Всього файлів</b></td>
                        <td>{stats?.files_total}</td>
                    </tr>
                    </tbody>
                </table>
            </div>



            {/* ОСТАННЄ ПРИЗНАЧЕННЯ */}
            <hr style={{ margin: "30px 0" }} />
            <h2>Останнє призначення</h2>

            <div className="card" style={{ maxWidth: "650px" }}>
                {!last_prescription ? (
                    <p>Призначень ще немає.</p>
                ) : (
                    <table className="table">
                        <tbody>
                        <tr>
                            <td><b>ID</b></td>
                            <td>{last_prescription.id}</td>
                        </tr>

                        <tr>
                            <td><b>Препарат</b></td>
                            <td>{last_prescription.medication_name}</td>
                        </tr>

                        <tr>
                            <td><b>Дата</b></td>
                            <td>{new Date(last_prescription.timestamp).toLocaleString()}</td>
                        </tr>

                        <tr>
                            <td><b>Файл</b></td>
                            <td>
                                {last_prescription.ipfs_url ? (
                                    <a href={last_prescription.ipfs_url} target="_blank">
                                        Переглянути
                                    </a>
                                ) : "—"}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                )}
            </div>



            {/* ОСТАННІЙ ФАЙЛ (ТАБЛИЦЯ) */}
            <hr style={{ margin: "30px 0" }} />
            <h2>Медичні файли</h2>

            <div className="card">
                {files.length === 0 ? (
                    <p>Файли відсутні.</p>
                ) : (
                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Тип файлу</th>
                            <th>Дата</th>
                            <th>Файл</th>
                        </tr>
                        </thead>

                        <tbody>
                        {files.map((f) => (
                            <tr key={f.id}>
                                <td>{f.id}</td>
                                <td>{f.file_type}</td>
                                <td>{new Date(f.created_at).toLocaleString()}</td>
                                <td>
                                    <a href={f.url} target="_blank">
                                        Переглянути
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}
