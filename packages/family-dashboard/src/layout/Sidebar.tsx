import { Link } from "react-router-dom";
import { LayoutDashboard, Activity, AlertTriangle, Settings, Users } from "lucide-react";

export const Sidebar = () => {
    return (
        <aside className="w-64 bg-[#1F2937] text-white flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight">ElderNest AI</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                <Link to="/family" className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-lg text-white">
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </Link>
                <Link to="/family/activity" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                    <Activity size={20} />
                    <span>Activity</span>
                </Link>
                <Link to="/family/alerts" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                    <AlertTriangle size={20} />
                    <span>Alerts</span>
                </Link>
                <Link to="/family/profile" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                    <Users size={20} />
                    <span>Elder Profile</span>
                </Link>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <Link to="/family/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors">
                    <Settings size={20} />
                    <span>Settings</span>
                </Link>
            </div>
        </aside>
    )
}
