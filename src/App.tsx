import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Gallery from './pages/Gallery';
import HallOfFame from './pages/HallOfFame';
import MyProfile from './pages/MyProfile';
import ManagementTeam from './pages/ManagementTeam';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import MediaUpload from './pages/admin/MediaUpload';
import WinnersManager from './pages/admin/WinnersManager';
import ManagementTeamManager from './pages/admin/ManagementTeamManager';
import ActivityLogsHidden from './pages/admin/ActivityLogsHidden';
import AdminGuard from './components/AdminGuard';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/hall-of-fame" element={<HallOfFame />} />
        <Route path="/management-team" element={<ManagementTeam />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/upload" element={<AdminGuard><MediaUpload /></AdminGuard>} />
        <Route path="/admin/winners" element={<AdminGuard><WinnersManager /></AdminGuard>} />
        <Route path="/admin/management-team" element={<AdminGuard><ManagementTeamManager /></AdminGuard>} />
        <Route path="/admin/_activity-log-room-26" element={<AdminGuard><ActivityLogsHidden /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  );
}
