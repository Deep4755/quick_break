import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Nearby from "./pages/Nearby";
import StationDetails from "./pages/StationDetails";
import NotFound from "./pages/NotFound";
import ProtectRoute from "./components/ProtectRoute";
import CreateReport from "./pages/CreateReport";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" style={{ background: "#f0f4f0" }}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Guest OR logged-in routes */}
        <Route path="/" element={
          <ProtectRoute requireAuth={false}><Home /></ProtectRoute>
        } />
        <Route path="/nearby" element={
          <ProtectRoute requireAuth={false}><Nearby /></ProtectRoute>
        } />
        <Route path="/stations/:id" element={
          <ProtectRoute requireAuth={false}><StationDetails /></ProtectRoute>
        } />

        {/* Logged-in only routes */}
        <Route path="/reports/create" element={
          <ProtectRoute requireAuth={true}><CreateReport /></ProtectRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
      <Footer />
    </div>
  );
}
