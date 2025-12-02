import { useState } from "react";
import api from "../../../api/axios";

export default function AddPatientModal({ close, reload }) {
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");

    // масиви (через кому)
    const [allergies, setAllergies] = useState("");
    const [chronic, setChronic] = useState("");

    const [error, setError] = useState("");

    const handleAdd = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/doctor/register-patient", {
                full_name,
                email,
                password,
                gender,
                age: age ? Number(age) : null,

                allergies: allergies
                    ? allergies.split(",").map(a => a.trim())
                    : [],

                chronic_conditions: chronic
                    ? chronic.split(",").map(c => c.trim())
                    : []
            });

            reload();
            close();

        } catch (err) {
            setError(err.response?.data?.error || "Помилка створення пацієнта.");
        }
    };

    return (
        <div className="modal-background">
            <div className="modal">
                <h2>Новий пацієнт</h2>

                <form className="form" onSubmit={handleAdd}>
                    <label>Повне ім’я</label>
                    <input value={full_name} onChange={(e) => setFullName(e.target.value)} />

                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label>Стать</label>
                    <input value={gender} onChange={(e) => setGender(e.target.value)} />

                    <label>Вік</label>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                    />

                    <label>Алергії (через кому)</label>
                    <input
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="Пилок, Пил, Морепродукти..."
                    />

                    <label>Хронічні стани (через кому)</label>
                    <input
                        value={chronic}
                        onChange={(e) => setChronic(e.target.value)}
                        placeholder="Астма, Діабет..."
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
