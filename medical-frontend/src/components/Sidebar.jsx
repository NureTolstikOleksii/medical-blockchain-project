import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Sidebar() {
    const { role, logout } = useContext(AuthContext);

    const menus = {
        admin: [
            { title: "Лікарі", path: "/dashboard/doctors" },
            { title: "Блокчейн-інфо", path: "/dashboard/blockchain" },
            { title: "Пацієнти", path: "/dashboard/patients" },
        ],

        doctor: [
            { title: "Мої пацієнти", path: "/dashboard/my-patients" },
        ],

        patient: [
            { title: "Мій профіль", path: "/dashboard/profile" },
            { title: "Історія призначень", path: "/dashboard/records" },
            { title: "Мої аналізи", path: "/dashboard/files" },
        ],
    };

    return (
        <div className="sidebar">
            <div className="top-section">
                <h2>Medical System</h2>

                <ul className="menu-list">
                    {menus[role]?.map((item) => (
                        <li key={item.path}>
                            <Link to={item.path}>{item.title}</Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="logout-section">
                <button className="logout-btn" onClick={logout}>
                    Вийти
                </button>
            </div>
        </div>
    );
}
