import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
	const { isLoggedIn, logout } = useAuth();
	const navigate = useNavigate();

	// keep behavior: only show when logged in
	if (!isLoggedIn) return null;

	const linkBase = "transition-colors duration-200 text-slate-300 hover:text-white";

	return (
		<header className="sticky top-0 z-50 bg-[#0b1120]/80 backdrop-blur-xl border-b border-white/10">
			<div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
				{/* Logo */}
				<NavLink to="/" className="text-2xl font-bold tracking-tight inline-flex items-center gap-1">
					<span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Quick</span>
					<span className="text-white">Break</span>
				</NavLink>

				{/* Links */}
				<nav className="flex items-center gap-6">
					<NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? "text-blue-400" : ""}`}>
						Home
					</NavLink>

					<NavLink to="/nearby" className={({ isActive }) => `${linkBase} ${isActive ? "text-blue-400" : ""}`}>
						Nearby
					</NavLink>

					<NavLink to="/reports/create" className={({ isActive }) => `${linkBase} ${isActive ? "text-blue-400" : ""}`}>
						Create Report
					</NavLink>

					<div className="h-6 w-px bg-white/10" />

					{/* Logout only */}
					<button
						onClick={() => {
							logout();
							navigate("/login");
						}}
						className="px-3 py-1 rounded-xl bg-white/6 border border-white/10 text-slate-100 transition-colors duration-200 hover:bg-white/10"
					>
						Logout
					</button>
				</nav>
			</div>
		</header>
	);
}
