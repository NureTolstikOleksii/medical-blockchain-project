import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function PatientFilesPage() {

    const [patient, setPatient] = useState(null);
    const [files, setFiles] = useState([]);
    const [measurements, setMeasurements] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            const resFiles = await api.get("/patient/files");

            setPatient(resFiles.data.patient);
            setFiles(resFiles.data.files);

            const resMeas = await api.get("/patient/measurements");
            setMeasurements(resMeas.data.measurements);

        } catch (e) {
            setError(e.response?.data?.error || "Помилка завантаження даних");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);


    if (loading) return <p>Завантаження...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h1>Мої файли</h1>
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
                            <th>Тип</th>
                            <th>Файл</th>
                            <th>Лікар</th>
                            <th>Дата</th>
                            <th>Перегляд</th>
                        </tr>
                        </thead>

                        <tbody>
                        {files.map((f) => (
                            <tr key={f.id}>
                                <td>{f.id}</td>
                                <td>{f.file_type}</td>
                                <td>{f.metadata?.originalName || "—"}</td>

                                <td>
                                    {f.uploaded_by
                                        ? f.uploaded_by.full_name
                                        : "—"}
                                </td>

                                <td>{new Date(f.created_at).toLocaleString()}</td>

                                <td>
                                    <a
                                        href={f.ipfs_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="primary-link"
                                    >
                                        Відкрити
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>


            {/* МЕДИЧНІ ПОКАЗНИКИ */}
            <hr style={{ margin: "30px 0" }} />
            <h2>Історія медичних показників</h2>
            <div className="card">

                {Object.keys(measurements).length === 0 ? (
                    <p>Показники відсутні.</p>
                ) : (
                    Object.entries(measurements).map(([type, entries]) => (
                        <div key={type} style={{ marginBottom: "25px" }}>
                            <h3 style={{ textTransform: "capitalize" }}>
                                {type.replaceAll("_", " ")}
                            </h3>

                            <table className="table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Значення</th>
                                    <th>Джерело</th>
                                    <th>Дата</th>
                                </tr>
                                </thead>

                                <tbody>
                                {entries.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.id}</td>
                                        <td>{m.value}</td>
                                        <td>{m.source}</td>
                                        <td>{new Date(m.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
}
