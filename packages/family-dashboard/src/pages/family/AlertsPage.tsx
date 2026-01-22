import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

export const AlertsPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
            <div className="grid gap-4">
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" size={20} />
                            Missed Medication
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Morning blood pressure medication not taken by 9:00 AM.</p>
                        <p className="text-sm text-gray-400 mt-2">2 hours ago</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={20} />
                            Check-in Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Daily mood check-in completed successfully.</p>
                        <p className="text-sm text-gray-400 mt-2">5 hours ago</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
