import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { Outlet, Navigate } from "react-router-dom";

export default function Dashboard() {
    const { token } = useContext(AuthContext);

    if (!token) return <Navigate to="/" />;

    return (
        <div className="layout">
            <div className="sidebar">
                <Sidebar />
            </div>

            <div className="content">
                <Outlet />
            </div>
        </div>
    );
}
