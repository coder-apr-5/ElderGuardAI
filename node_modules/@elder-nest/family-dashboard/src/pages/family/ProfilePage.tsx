import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfilePage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Elder Profile</h1>
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                            <User size={64} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Martha Stewart</h2>
                        <p className="text-gray-500">Age: 78</p>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Share</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Contact & Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Phone className="text-gray-400" />
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="text-gray-400" />
                            <span>123 Maple Avenue, Springfield</span>
                        </div>
                        <div className="pt-4">
                            <h3 className="font-semibold mb-2">Medical Conditions</h3>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Hypertension</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Arthritis</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
