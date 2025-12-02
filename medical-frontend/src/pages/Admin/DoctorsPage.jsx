import { useEffect, useState } from "react";
import api from "../../api/axios";
import AddDoctorModal from "./components/AddDoctorModal";

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadDoctors = async () => {
        try {
            const res = await api.get("/admin/doctors");
            setDoctors(res.data.doctors);
        } catch (err) {
            console.error("Помилка завантаження лікарів:", err);
        }
    };

    useEffect(() => {
        loadDoctors();
    }, []);

    const deactivateDoctor = async (id) => {
        try {
            await api.patch(`/admin/doctors/${id}/deactivate`);
            loadDoctors();
        } catch (err) {
            console.error("Помилка блокування:", err);
        }
    };

    const activateDoctor = async (id) => {
        try {
            await api.patch(`/admin/doctors/${id}/activate`);
            loadDoctors();
        } catch (err) {
            console.error("Помилка розблокування:", err);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h1>Лікарі</h1>

                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    Додати лікаря
                </button>
            </div>

            <div className="card" style={{ marginTop: "20px" }}>
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ім'я</th>
                        <th>Email</th>
                        <th>Спеціалізація</th>
                        <th>Ліцензія</th>
                        <th>Досвід</th>
                        <th>Гаманець</th>
                        <th>Статус</th>
                        <th>Дія</th>
                    </tr>
                    </thead>

                    <tbody>
                    {doctors.map((doc) => (
                        <tr key={doc.id}>
                            <td>{doc.id}</td>
                            <td>{doc.full_name}</td>
                            <td>{doc.email}</td>

                            <td>
                                {doc.doctor_profiles?.specialization || "—"}
                            </td>

                            <td>
                                {doc.doctor_profiles?.license_number || "—"}
                            </td>

                            <td>
                                {doc.doctor_profiles?.experience_years
                                    ? doc.doctor_profiles.experience_years + " років"
                                    : "—"}
                            </td>

                            <td>
                                <code>{doc.wallet}</code>
                            </td>

                            {/* СТАТУС */}
                            <td>
                                {doc.is_active ? (
                                    <span style={{ color: "green", fontWeight: "600" }}>Активний</span>
                                ) : (
                                    <span style={{ color: "red", fontWeight: "600" }}>Заблокований</span>
                                )}
                            </td>

                            {/* КНОПКИ */}
                            <td>
                                {doc.is_active ? (
                                    <button
                                        className="danger-btn"
                                        onClick={() => deactivateDoctor(doc.id)}
                                    >
                                        Заблокувати
                                    </button>
                                ) : (
                                    <button
                                        className="success-btn"
                                        onClick={() => activateDoctor(doc.id)}
                                    >
                                        Розблокувати
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {doctors.length === 0 && <p>Немає лікарів.</p>}
            </div>

            {isModalOpen && (
                <AddDoctorModal
                    close={() => setIsModalOpen(false)}
                    reload={loadDoctors}
                />
            )}
        </div>
    );
}
