import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-white">404 — Not Found</h1>
        <p className="text-gray-300 mt-2">We couldn't find the page you're looking for.</p>

        <div className="mt-6 space-y-3">
          <button onClick={() => navigate('/')} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90">Go Home</button>
          <button onClick={() => navigate(-1)} className="w-full py-3 rounded-xl border border-white/20 text-white bg-white/5 hover:bg-white/10">Go Back</button>
        </div>
      </div>
    </div>
  );
}