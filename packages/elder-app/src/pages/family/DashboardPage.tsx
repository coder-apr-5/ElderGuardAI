import { useState, useEffect } from "react";
import { RiskMeter } from "@/features/family/risk/RiskMeter";
import { ActivityTimeline } from "@/features/family/activity/ActivityTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Pill, Heart, AlertTriangle, Users } from "lucide-react";
import { useConnectedElders, useElderStatus } from "@/hooks/useElderData";

export const DashboardPage = () => {
    // 1. Fetch Connected Elders
    const { elders: realElders, loading: eldersLoading } = useConnectedElders();
    const [selectedElderId, setSelectedElderId] = useState<string | null>(null);

    // STATIC PRESENTATION DATA
    const MOCK_ELDER = { uid: 'demo-123', name: 'Martha (Demo)', photo: null };
    const MOCK_STATUS = {
        isEmergency: false,
        riskScore: 35,
        medicineCompliance: 80,
        vitals: { stability: 'Stable', heartRate: 72 },
        mood: 'happy'
    };

    const elders = realElders.length > 0 ? realElders : [MOCK_ELDER];

    // Select the first elder by default when list loads
    useEffect(() => {
        if (elders.length > 0 && !selectedElderId) {
            setSelectedElderId(elders[0].uid);
        }
    }, [elders, selectedElderId]);

    // 2. Fetch Status for Selected Elder
    const { data: elderStatus, loading: statusLoading } = useElderStatus(selectedElderId);

    const currentElder = elders.find(e => e.uid === selectedElderId) || elders[0];

    if (eldersLoading) {
        return <div className="p-8 text-center">Loading family members...</div>;
    }

    if (elders.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No elders connected</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by connecting to an elder using their share code.</p>
            </div>
        );
    }

    // If it's the mock elder, use mock status; otherwise use fetched status
    const actualStatus = (currentElder?.uid === MOCK_ELDER.uid) ? MOCK_STATUS : elderStatus;
    // If loading status for real elder, show loading; for mock, it's instant
    const isLoadingData = (currentElder?.uid === MOCK_ELDER.uid) ? false : statusLoading;

    return (
        <div className="space-y-6">
            {/* Header / Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">
                    Dashboard for <span className="text-indigo-600">{currentElder?.name}</span>
                </h2>
                {/* Simple Elder Switcher */}
                <div className="flex gap-2">
                    {elders.map(elder => (
                        <button
                            key={elder.uid}
                            onClick={() => setSelectedElderId(elder.uid)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedElderId === elder.uid
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-white text-gray-600 border border-transparent hover:bg-gray-50'
                                }`}
                        >
                            {elder.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Emergency Alert Banner */}
            {actualStatus?.isEmergency && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 font-bold">
                                SOS ALERT: Emergency button triggered! Check on {currentElder?.name} immediately.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Risk Score Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Risk Score</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <div className="h-24 flex items-center justify-center text-sm text-gray-400">Analyzing...</div>
                        ) : (
                            <RiskMeter score={actualStatus?.riskScore || 0} />
                        )}
                    </CardContent>
                </Card>

                {/* Medicine Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Medicine Adherence</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{actualStatus?.medicineCompliance || 0}%</div>
                        <p className="text-xs text-muted-foreground">Today's compliance</p>
                        <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-1000"
                                style={{ width: `${actualStatus?.medicineCompliance || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Vitals Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vitals Status</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{actualStatus?.vitals.stability || 'Unknown'}</div>
                        <p className="text-xs text-muted-foreground">
                            Heart Rate: {actualStatus?.vitals.heartRate || '--'} bpm
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ActivityTimeline />
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Mood Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
                        {isLoadingData ? (
                            <span className="text-muted-foreground">Loading trends...</span>
                        ) : (
                            <div className="text-center">
                                <span className="text-4xl mb-2 block">
                                    {actualStatus?.mood === 'happy' ? '😊' : actualStatus?.mood === 'sad' ? '😔' : '😐'}
                                </span>
                                <span className="text-muted-foreground">Current Mood: {actualStatus?.mood}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
