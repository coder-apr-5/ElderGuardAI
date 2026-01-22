import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const SettingsPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Emergency Alerts</Label>
                            <p className="text-sm text-gray-500">Receive instant push notifications for SOS.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Daily Summary</Label>
                            <p className="text-sm text-gray-500">Get a daily report of activity.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button variant="destructive">Sign Out</Button>
            </div>
        </div>
    )
}
