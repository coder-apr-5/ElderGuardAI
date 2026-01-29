import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Phone, MapPin, Heart, AlertCircle, Droplet, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, db } from "@elder-nest/shared";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import type { ElderUser, FamilyUser } from "@elder-nest/shared";
import { useNavigate } from "react-router-dom";

export const ElderProfileView = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [elderData, setElderData] = useState<ElderUser | null>(null);
    const [notConnected, setNotConnected] = useState(false);

    useEffect(() => {
        const fetchConnection = async () => {
            if (!auth.currentUser) return;

            // Get Family User Data to find connected Elder ID
            const familyRef = doc(db, 'users', auth.currentUser.uid);
            const familySnap = await getDoc(familyRef);

            if (familySnap.exists()) {
                const familyData = familySnap.data() as FamilyUser;
                const connectedElders = familyData.eldersConnected || [];

                if (connectedElders.length === 0) {
                    setNotConnected(true);
                    setLoading(false);
                    return;
                }

                // Listen to the first connected Elder
                const elderId = connectedElders[0];
                const elderRef = doc(db, 'users', elderId);

                const unsubscribe = onSnapshot(elderRef, (doc) => {
                    if (doc.exists()) {
                        setElderData(doc.data() as ElderUser);
                    }
                    setLoading(false);
                });

                return () => unsubscribe();
            } else {
                setLoading(false);
            }
        };

        fetchConnection();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Elder Profile...</div>;

    if (notConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-orange-50 rounded-3xl border border-orange-100">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <UserPlus size={40} className="text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Elder Connected</h2>
                <p className="text-gray-600 mb-6 max-w-sm">
                    You need to enter the Family Code provided by your elder to view their profile and live updates.
                </p>
                <Button onClick={() => navigate('/family/connect')} className="bg-orange-500 hover:bg-orange-600 text-white">
                    Connect Now
                </Button>
            </div>
        );
    }

    if (!elderData) return <div className="p-8 text-center">Elder data not found.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Elder Profile (Live)</h1>
            <div className="grid md:grid-cols-3 gap-6">

                {/* Main Profile Card */}
                <Card className="md:col-span-1 border-gray-200 shadow-sm overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-orange-400 to-pink-500"></div>
                    <CardContent className="pt-0 flex flex-col items-center -mt-12 relative z-10">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 mb-4 flex items-center justify-center overflow-hidden shadow-md">
                            {elderData.photoURL ? (
                                <img src={elderData.photoURL} alt={elderData.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-gray-400" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">{elderData.fullName}</h2>
                        {elderData.dob && (
                            <p className="text-gray-500 text-sm mt-1">
                                DOB: {new Date(elderData.dob).toLocaleDateString()}
                            </p>
                        )}
                        <span className="mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
                            Online
                        </span>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="md:col-span-2 border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="text-pink-500" size={20} fill="currentColor" />
                            Health & Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <Phone className="text-blue-500 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                                    <p className="text-sm font-semibold">{elderData.phoneNumber || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <MapPin className="text-orange-500 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Location</p>
                                    <p className="text-sm font-semibold">{elderData.address || "N/A"}</p>
                                    {elderData.state && <p className="text-xs text-gray-600">{elderData.state}, {elderData.nationality}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <Droplet className="text-red-500 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Blood Group</p>
                                    <p className="text-sm font-semibold">{elderData.bloodGroup || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <AlertCircle className="text-indigo-500 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Medical Conditions</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {elderData.diseases?.length ? (
                                            elderData.diseases.map((d, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                                                    {d}
                                                </span>
                                            ))
                                        ) : <span className="text-xs text-gray-400">None listed</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Family of Elder (Manual List) */}
                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="font-semibold mb-3 text-gray-700">Their Family Network</h3>
                            {elderData.manualFamilyMembers && elderData.manualFamilyMembers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {elderData.manualFamilyMembers.map((mem, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                {mem.photoURL ? <img src={mem.photoURL} alt={mem.name} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{mem.name}</p>
                                                <p className="text-xs text-gray-500">{mem.relation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No network contacts added by elder.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
