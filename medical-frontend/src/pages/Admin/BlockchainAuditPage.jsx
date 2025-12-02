import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function BlockchainAuditPage() {
    const [audit, setAudit] = useState(null);

    const loadAudit = async () => {
        try {
            const res = await api.get("/admin/audit");
            setAudit(res.data);
        } catch (err) {
            console.error("Помилка завантаження аудиту:", err);
        }
    };

    useEffect(() => {
        loadAudit();
    }, []);

    if (!audit) return <p>Завантаження...</p>;

    return (
        <div>
            <h1>Аудит системи</h1>

            {/* AUTH LOGS */}
            <div className="card" style={{ marginTop: "25px" }}>
                <h2>Історія входів</h2>

                <table className="table" style={{ marginTop: "15px" }}>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Користувач</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>IP</th>
                        <th>User Agent</th>
                        <th>Успіх</th>
                        <th>Час</th>
                    </tr>
                    </thead>

                    <tbody>
                    {audit.auth_logs.map(log => (
                        <tr key={log.id}>
                            <td>{log.id}</td>

                            <td>{log.user ? log.user.full_name : "—"}</td>
                            <td>{log.user ? log.user.email : "—"}</td>
                            <td>{log.user ? log.user.role : "—"}</td>

                            <td>{log.ip || "—"}</td>
                            <td>{log.user_agent || "—"}</td>

                            <td style={{ color: log.success ? "green" : "red" }}>
                                {log.success ? "✔" : "✖"}
                            </td>

                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* BLOCKCHAIN EVENTS */}
            <div className="card" style={{ marginTop: "35px" }}>
                <h2>Події блокчейну</h2>

                <table className="table" style={{ marginTop: "15px" }}>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Подія</th>
                        <th>Tx Hash</th>
                        <th>Block</th>
                        <th>Payload</th>
                        <th>Дата</th>
                    </tr>
                    </thead>

                    <tbody>
                    {audit.blockchain_events.map(ev => (
                        <tr key={ev.id}>
                            <td>{ev.id}</td>
                            <td>{ev.event_name}</td>

                            <td>
                                <code>{ev.tx_hash}</code>
                            </td>

                            <td>{ev.block_number}</td>

                            <td>
                                <pre style={{
                                    background:"#f7f7f7",
                                    padding:"6px",
                                    borderRadius:"8px",
                                    fontSize:"12px"
                                }}>
                                  {Object.keys(ev.payload).length > 0
                                      ? JSON.stringify(ev.payload, null, 2)
                                      : "—"}
                                </pre>
                            </td>

                            <td>{new Date(ev.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
