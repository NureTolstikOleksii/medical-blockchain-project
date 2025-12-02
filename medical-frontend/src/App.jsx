import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import DoctorsPage from "./pages/Admin/DoctorsPage";
import BlockchainAuditPage from "./pages/Admin/BlockchainAuditPage.jsx";
import MyPatientsPage from "./pages/Doctor/MyPatientsPage.jsx";
import PatientDetailsPage from "./pages/Doctor/PatientDetailsPage.jsx";
import PatientProfilePage from "./pages/Patient/PatientProfilePage.jsx";
import PatientPrescriptionsPage from "./pages/Patient/PatientPrescriptionsPage.jsx";
import PatientFilesPage from "./pages/Patient/PatientFilesPage.jsx";
import AdminPatientsPage from "./pages/Admin/AdminPatientsPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />}>
                <Route path="doctors" element={<DoctorsPage />} />
                <Route path="blockchain" element={<BlockchainAuditPage />} />
                <Route path="my-patients" element={<MyPatientsPage />} />
                <Route path="my-patients/:id" element={<PatientDetailsPage />} />
                <Route path="profile" element={<PatientProfilePage />} />
                <Route path="records" element={<PatientPrescriptionsPage />} />
                <Route path="files" element={<PatientFilesPage />} />
                <Route path="patients" element={<AdminPatientsPage />} />
            </Route>

        </Routes>
    );
}
