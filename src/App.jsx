import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardAdminEcole from './pages/DashboardAdminEcole';
import Profil from './pages/Profil';
import UtilisateursAdminEcole from './pages/UtilisateursAdminEcole';
import NouvelUtilisateur from './pages/NouvelUtilisateur';
import NouveauMemoire from './pages/NouveauMemoire';
import ModifierUtilisateur from './pages/ModifierUtilisateur';
import DetailMemoire from './pages/DetailMemoire';
import MemoiresAdminEcole from './pages/MemoiresAdminEcole';
import ModifierMemoire from './pages/ModifierMemoire';
import AvancementMemoires from './pages/AvancementMemoires';
import FilieresAdminEcole from './pages/FilieresAdminEcole';
import GestionCycles from './pages/GestionCycles';
import DashboardEtudiant from './pages/DashboardEtudiant';
import DashboardEncadrant from './pages/DashboardEncadrant';
import DashboardAdminPlateforme from './pages/DashboardAdminPlateforme';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />

                {/* Admin École */}
                <Route path="/dashboard/admin-ecole" element={<DashboardAdminEcole />} />
                <Route path="/dashboard/admin-ecole/profil" element={<Profil />} />
                <Route path="/dashboard/admin-ecole/utilisateurs" element={<UtilisateursAdminEcole />} />
                <Route path="/dashboard/admin-ecole/utilisateurs/nouveau" element={<NouvelUtilisateur />} />
                <Route path="/dashboard/admin-ecole/utilisateurs/:id/modifier" element={<ModifierUtilisateur />} />
                <Route path="/dashboard/admin-ecole/memoires" element={<MemoiresAdminEcole />} />
                <Route path="/dashboard/admin-ecole/memoires/nouveau" element={<NouveauMemoire />} />
                <Route path="/dashboard/admin-ecole/memoires/:id/modifier" element={<ModifierMemoire />} />
                <Route path="/dashboard/admin-ecole/memoires/:id" element={<DetailMemoire />} />
                <Route path="/dashboard/admin-ecole/avancement" element={<AvancementMemoires />} />
                <Route path="/dashboard/admin-ecole/filieres" element={<FilieresAdminEcole />} />
                <Route path="/dashboard/admin-ecole/cycles" element={<GestionCycles />} />

                {/* Étudiant */}
                <Route path="/dashboard/etudiant" element={<DashboardEtudiant />} />
                <Route path="/dashboard/etudiant/profil" element={<Profil />} />

                {/* Encadrant */}
                <Route path="/dashboard/encadrant/profil" element={<Profil />} />
                <Route path="/dashboard/encadrant" element={<DashboardEncadrant />} />

                {/* Admin Plateforme */}
                <Route path="/dashboard/admin/profil" element={<Profil />} />
                <Route path="/dashboard/admin" element={<DashboardAdminPlateforme />} />
            </Routes>
        </BrowserRouter>
    );
}