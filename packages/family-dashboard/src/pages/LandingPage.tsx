import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Shield } from "lucide-react";

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        ElderNest AI
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        A unified platform for compassionate care and independent living.
                        Please select your portal to continue.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Elder Portal */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer border-2 border-transparent hover:border-green-400"
                        onClick={() => navigate('/auth/login?role=elder')}>
                        <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                            <Heart className="w-8 h-8 text-green-700" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            I am an Elder
                        </h2>
                        <p className="text-gray-500 mb-8 text-lg">
                            Access your daily health assistant, mood tracker, and emergency support.
                        </p>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 rounded-xl">
                            Enter Elder Portal <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>

                    {/* Family Portal */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer border-2 border-transparent hover:border-blue-400"
                        onClick={() => navigate('/auth/login?role=family')}>
                        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                            <Shield className="w-8 h-8 text-blue-700" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            I am a Caregiver
                        </h2>
                        <p className="text-gray-500 mb-8 text-lg">
                            Monitor your loved one's health, receive alerts, and manage settings.
                        </p>
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-lg py-6 rounded-xl">
                            Enter Family Portal <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
