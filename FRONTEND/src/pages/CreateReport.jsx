import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import reportApi from "../api/reportApi";

export default function CreateReport() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    stationId: "",
    rating: 5,
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // reportApi should send token via axios interceptor (Authorization Bearer ...)
      await reportApi.createReport({
        stationId: form.stationId,
        rating: Number(form.rating),
        comment: form.comment,
      });

      // navigate to home after successful report
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white">Create report</h1>
        <p className="text-gray-300 mt-2">Share your experience about a service station</p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Station ID</label>
            <input
              name="stationId"
              value={form.stationId}
              onChange={handleChange}
              placeholder="e.g. 698c878e66b155c3f0bbb872"
              required
              className="w-full rounded-xl bg-white/20 text-white placeholder-gray-300 border border-white/30 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-sm text-gray-300 mt-2">Tip: Copy stationId from Station Details page.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Rating (1-5)</label>
            <select
              name="rating"
              value={form.rating}
              onChange={handleChange}
              className="w-full rounded-xl bg-white/20 text-white placeholder-gray-300 border border-white/30 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value={5}>⭐⭐⭐⭐⭐</option>
              <option value={4}>⭐⭐⭐⭐</option>
              <option value={3}>⭐⭐⭐</option>
              <option value={2}>⭐⭐</option>
              <option value={1}>⭐</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Comment</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={5}
              placeholder="Write your experience..."
              className="w-full rounded-xl bg-white/20 text-white placeholder-gray-300 border border-white/30 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full rounded-xl border border-white/20 text-white py-3 hover:bg-white/5"
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}
