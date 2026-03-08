import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

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
    <>
      <Navbar />
      <Routes>
        {/* public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* protected routes */}
        <Route
          path="/"
          element={
            <ProtectRoute>
              <Home />
            </ProtectRoute>
          }
        />

        <Route
          path="/nearby"
          element={
            <ProtectRoute>
              <Nearby />
            </ProtectRoute>
          }
        />

        <Route
          path="/reports/create"
          element={
            <ProtectRoute>
              <CreateReport />
            </ProtectRoute>
          }
        />

        <Route
          path="/stations/:id"
          element={
            <ProtectRoute>
              <StationDetails />
            </ProtectRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
