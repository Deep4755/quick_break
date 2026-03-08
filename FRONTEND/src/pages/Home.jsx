import React from "react";
import { useNavigate } from "react-router-dom";
import BexxaVoiceAssistant from "../components/BexxaVoiceAssistant";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white">QuickBreak</h1>
        <p className="text-gray-300 mt-2">Find and review motorway service stations quickly.</p>

        <div className="mt-6 space-y-4">
          <p className="text-white/80">Get started</p>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => navigate('/nearby')}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white"
            >
              Nearby Stations
            </button>

            <button
              onClick={() => navigate('/reports/create')}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white"
            >
              Create Report
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="w-full py-3 rounded-xl border border-white/20 text-white bg-white/5 hover:bg-white/10"
            >
              Browse Stations
            </button>
          </div>
        </div>
        <BexxaVoiceAssistant />
      </div>
    </div>
  );
}