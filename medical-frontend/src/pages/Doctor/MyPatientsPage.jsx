import { useEffect, useState } from "react";
import api from "../../api/axios";
import AddPatientModal from "./components/AddPatientModal";
import { useNavigate } from "react-router-dom";

export default function MyPatientsPage() {
    const [patients, setPatients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const loadPatients = async () => {
        try {
            const res = await api.get("/doctor/patients");
            setPatients(res.data);
        } catch (err) {
            console.error("Помилка завантаження пацієнтів:", err);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h1>Мої пацієнти</h1>

                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    Додати пацієнта
                </button>
            </div>

            <div className="card" style={{ marginTop: "20px" }}>
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ім’я</th>
                        <th>Email</th>
                        <th>Стать</th>
                        <th>Вік</th>
                        <th>Алергії</th>
                        <th>Хронічні стани</th>
                        <th>Гаманець</th>
                    </tr>
                    </thead>

                    <tbody>
                    {patients.map((p) => (
                        <tr key={p.id} onClick={() => navigate(`/dashboard/my-patients/${p.id}`)} className="table-row-click">
                            <td>{p.id}</td>
                            <td>{p.full_name}</td>
                            <td>{p.email}</td>
                            <td>{p.patient_profiles?.gender || "—"}</td>
                            <td>{p.patient_profiles?.age || "—"}</td>
                            <td>{p.patient_profiles?.allergies?.join(", ") || "—"}</td>
                            <td>{p.patient_profiles?.chronic_conditions?.join(", ") || "—"}</td>
                            <td><code>{p.wallet}</code></td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {patients.length === 0 && <p>Поки немає пацієнтів.</p>}
            </div>

            {isModalOpen && (
                <AddPatientModal
                    close={() => setIsModalOpen(false)}
                    reload={loadPatients}
                />
            )}
        </div>
    );
}
