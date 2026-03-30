import { Link, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Settings, Users, Pill } from "lucide-react";

export const Sidebar = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname.startsWith(path);

    const navLink = (to: string, icon: React.ReactNode, label: string) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(to)
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );

    return (
        <aside className="w-64 bg-[#1F2937] text-white flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">ElderGuard AI</h1>
                <p className="text-xs text-gray-400 mt-0.5">Family Dashboard</p>
            </div>
            <nav className="flex-1 px-4 space-y-1.5">
                {navLink('/family/medications', <Pill size={20} />, 'Medications')}
                {navLink('/family/activity', <Activity size={20} />, 'Activity')}
                {navLink('/family/alerts', <AlertTriangle size={20} />, 'Alerts')}
                {navLink('/family/profile', <Users size={20} />, 'Elder Profile')}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <Link to="/family/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                    <Settings size={20} />
                    <span>Settings</span>
                </Link>
            </div>
        </aside>
    );
}
