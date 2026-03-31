import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ShieldAlert, Bell } from "lucide-react";
import { useConnectedElders } from "@/hooks/useElderData";

interface Notification {
    id: string;
    type: string;
    message: string;
    timestamp: any; // Firestore Timestamp
    read: boolean;
    elderName?: string; // Enhanced with elder name
}

export const AlertsPage = () => {
    const { elders, loading } = useConnectedElders();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (elders.length === 0) return;

        const fetchAlerts = () => {
            elders.forEach(elder => {
                const docStr = localStorage.getItem(`users_${elder.uid}`);
                if (docStr) {
                    const data = JSON.parse(docStr);
                    const notifs = (data.notifications || []) as Notification[];

                    const enhancedNotifs = notifs.map(n => ({
                        ...n,
                        elderName: elder.name
                    }));

                    setNotifications(prev => {
                        const others = prev.filter(n => n.elderName !== elder.name);
                        return [...others, ...enhancedNotifs].sort((a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                    });
                }
            });
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);

        return () => clearInterval(interval);
    }, [elders]);

    if (loading) return <div>Loading alerts...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <Bell className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No new notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id || Math.random()}
                            className={`border-l-4 ${notif.type === 'security_alert' ? 'border-l-red-600 bg-red-50/50' :
                                    notif.type === 'emergency' ? 'border-l-red-500' :
                                        notif.type === 'missed_meds' ? 'border-l-yellow-500' :
                                            'border-l-blue-500'
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {notif.type === 'security_alert' ? <ShieldAlert className="text-red-600 animate-pulse" size={20} /> :
                                        notif.type === 'emergency' ? <AlertTriangle className="text-red-500" size={20} /> :
                                            notif.type === 'missed_meds' ? <AlertTriangle className="text-yellow-500" size={20} /> :
                                                <CheckCircle className="text-blue-500" size={20} />}

                                    {notif.type === 'security_alert' ? 'Security Alert' :
                                        notif.type === 'emergency' ? 'Emergency Alert' :
                                            'System Notification'}

                                    <span className="text-xs font-normal text-gray-400 ml-auto">
                                        {notif.elderName} • {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Just now'}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-800 font-medium">{notif.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
