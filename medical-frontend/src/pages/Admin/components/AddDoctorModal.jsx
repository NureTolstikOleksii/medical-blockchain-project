import { useState } from "react";
import api from "../../../api/axios.js";

export default function AddDoctorModal({ close, reload }) {
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [experience_years, setExperienceYears] = useState("");
    const [license_number, setLicenseNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleAdd = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/admin/register-doctor", {
                full_name,
                email,
                specialization,
                license_number,
                password,
                experience_years: experience_years === "" ? null : Number(experience_years),
            });

            reload();
            close();
        } catch (err) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Помилка створення лікаря.");
            }
        }
    };

    return (
        <div className="modal-background">
            <div className="modal">
                <h2>Новий лікар</h2>

                <form className="form" onSubmit={handleAdd}>
                    <label>Повне ім’я</label>
                    <input value={full_name} onChange={(e) => setFullName(e.target.value)} />

                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label>Спеціалізація</label>
                    <input
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                    />
                    <label>Досвід</label>
                    <input
                        type="number"
                        value={experience_years}
                        onChange={(e) => setExperienceYears(e.target.value)}
                    />
                    <label>Номер ліцензії</label>
                    <input
                        value={license_number}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                    />

                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p className="error-message">{error}</p>}

                    <div className="modal-buttons">
                        <button type="button" className="secondary-btn" onClick={close}>
                            Закрити
                        </button>
                        <button type="submit" className="primary-btn">
                            Створити
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
