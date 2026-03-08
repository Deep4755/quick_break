import React from "react";
import { useNavigate } from "react-router-dom";

export default function Station() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-white">Stations</h2>
        <p className="text-gray-300 mt-2">Browse service stations and open any station to view details.</p>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white">Sample Station</h3>
            <p className="text-gray-300 mt-1">Short description or address</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10">Back</button>
            <button onClick={() => navigate('/nearby')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90">Nearby</button>
          </div>
        </div>
      </div>
    </div>
  );
}