import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export const MedicineList = () => {
    return (
        <Card className="border-2 border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                    <Clock size={32} />
                    Next Medicine
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div>
                        <h4 className="text-2xl font-bold">Heart Pill (Aspirin)</h4>
                        <p className="text-xl text-gray-600">1 Tablet • After Lunch</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                        2:00 PM
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
