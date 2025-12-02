import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminPatientsPage() {

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Модальне вікно
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [doctors, setDoctors] = useState([]);
    const [accessMap, setAccessMap] = useState({}); // doctorId → boolean

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    const loadPatients = async () => {
        try {
            const res = await api.get("/admin/patients");
            setPatients(res.data.patients);
        } catch (e) {
            setError(e.response?.data?.error || "Помилка завантаження пацієнтів");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const openModal = async (patient) => {
        setSelectedPatient(patient);
        setModalOpen(true);
        setModalLoading(true);
        setModalError("");

        try {
            const res = await api.get("/admin/doctors");
            setDoctors(res.data.doctors);

            const walletAccess = {};

            for (const doctor of res.data.doctors) {
                try {
                    const check = await api.get(
                        `/admin/access/check?doctor=${doctor.wallet}&patient=${patient.wallet}`
                    );
                    walletAccess[doctor.id] = check.data.access === true;
                } catch {
                    walletAccess[doctor.id] = false;
                }
            }
            setAccessMap(walletAccess);

        } catch (e) {
            console.log(e);
            setModalError("Помилка завантаження лікарів");
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedPatient(null);
        setDoctors([]);
        setAccessMap({});
    };

    const grantAccess = async (doctorId) => {
        try {
            await api.post(`/admin/patients/${selectedPatient.id}/grant-access/${doctorId}`);

            setAccessMap(prev => ({ ...prev, [doctorId]: true }));
        } catch (e) {
            console.log(e);
            alert("Помилка при наданні доступу");
        }
    };

    const revokeAccess = async (doctorId) => {
        try {
            await api.post(`/admin/patients/${selectedPatient.id}/revoke-access/${doctorId}`);

            setAccessMap(prev => ({ ...prev, [doctorId]: false }));
        } catch (e) {
            console.log(e);
            alert("Помилка при відкликанні доступу");
        }
    };

    if (loading) return <p>Завантаження...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h1>Усі пацієнти</h1>

            <div className="card">
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>ПІБ</th>
                        <th>Email</th>
                        <th>Стать</th>
                        <th>Вік</th>
                        <th>Wallet</th>
                        <th>Дата</th>
                    </tr>
                    </thead>

                    <tbody>
                    {patients.map((p) => (
                        <tr
                            key={p.id}
                            className="table-row-click"
                            onClick={() => openModal(p)}
                        >
                            <td>{p.id}</td>
                            <td>{p.full_name}</td>
                            <td>{p.email}</td>
                            <td>{p.patient_profiles?.gender || "—"}</td>
                            <td>{p.patient_profiles?.age || "—"}</td>
                            <td><code>{p.wallet}</code></td>
                            <td>{new Date(p.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* МОДАЛЬНЕ ВІКНО */}
            {modalOpen && (
                <div className="modal-background">
                    <div className="modal" style={{ width: "600px" }}>

                        <h2>Управління доступами</h2>
                        <p><b>Пацієнт:</b> {selectedPatient?.full_name}</p>
                        <p><b>Wallet:</b> <code>{selectedPatient?.wallet}</code></p>

                        <hr style={{ margin: "20px 0" }}/>

                        {modalLoading ? (
                            <p>Завантаження...</p>
                        ) : modalError ? (
                            <p className="error-message">{modalError}</p>
                        ) : (
                            <>
                                <h3>Лікарі</h3>

                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th>Імʼя</th>
                                        <th>Спеціалізація</th>
                                        <th>Доступ</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {doctors.map((doc) => (
                                        <tr key={doc.id}>
                                            <td>{doc.full_name}</td>
                                            <td>{doc.doctor_profiles?.specialization || "—"}</td>

                                            <td>
                                                {accessMap[doc.id] ? (
                                                    <button
                                                        className="danger-btn"
                                                        onClick={() => revokeAccess(doc.id)}
                                                    >
                                                        Забрати доступ
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="success-btn"
                                                        onClick={() => grantAccess(doc.id)}
                                                    >
                                                        Надати доступ
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        <div className="modal-buttons">
                            <button className="secondary-btn" onClick={closeModal}>
                                Закрити
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
