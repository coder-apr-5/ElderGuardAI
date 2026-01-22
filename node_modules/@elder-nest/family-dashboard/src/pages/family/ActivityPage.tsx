import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const ActivityPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Recent Activity</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Daily Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <div className="flex-1">
                                    <p className="font-medium">Movement Detected in Living Room</p>
                                    <p className="text-sm text-gray-500">Today, 10:23 AM</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
