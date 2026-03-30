import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmergencyButton } from "@/features/emergency/EmergencyButton";

import { MedicineList } from "@/features/medicine/MedicineList";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  MessageCircleHeart,
  Pill,
  CloudSun,
  Phone,
  Stethoscope,
  Heart,
  LogOut,
  ArrowLeft,
  User,
  Sparkles
} from "lucide-react";
import { CameraMonitor } from "@/features/camera";
import { RealTimeClock, ClockWidget } from "@/components/ClockWidget";

export const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { signOut } = await import("@elder-nest/shared");
      await signOut();
      navigate('/auth/login');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };
  /* ---------------- THEME ---------------- */
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("elderDarkMode");
    return saved
      ? saved === "true"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("elderDarkMode", String(isDarkMode));
  }, [isDarkMode]);

  /* ---------------- USER DATA ---------------- */
  const [userName, setUserName] = useState("Friend");
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]); // Using any for simplicity or import type

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { auth, db, localUserStore } = await import("@elder-nest/shared");
        const { doc, getDoc } = await import("firebase/firestore");
        const user = auth.currentUser;
        if (!user) return;

        setUserName(user.displayName?.split(" ")[0] || "Friend");

        let userData: any = null;
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            userData = snap.data();
            // Cache locally if Firestore succeeds
            localUserStore.save({ ...userData, uid: user.uid });
          }
        } catch (e) {
          console.warn("⚠️ Firestore unavailable on Home, trying Local Store...");
        }

        // Fallback to local store if Firestore failed or was empty
        if (!userData) {
          userData = localUserStore.get(user.uid);
        }

        if (userData) {
          setConnectionCode(userData.connectionCode);
          setEmergencyContact(userData.emergencyContact);
          setFamilyMembers(userData.manualFamilyMembers || []);
          if (userData.fullName) {
             setUserName(userData.fullName.split(" ")[0]);
          }
        }
      } catch (e) {
        console.error("Critical error fetching profile:", e);
      }
    };
    fetchProfile();
  }, []);

  /* ---------------- ACCESSIBILITY ---------------- */
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");
  const heading = fontSize === "large" ? "text-4xl" : "text-3xl";
  const cardTitle = fontSize === "large" ? "text-2xl" : "text-xl";

  const [showBanner, setShowBanner] = useState(true);

  const shareCode = async () => {
    if (connectionCode && navigator.share) {
      await navigator.share({
        title: "ElderNest Family Code",
        text: `Use my family connection code: ${connectionCode}`,
      });
    }
  };

  /* ---------------- ANIMATION VARIANTS ---------------- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Filter Doctors from family members (assuming relation='Doctor')
  const doctors = familyMembers.filter(m => m.relation?.toLowerCase().includes('doctor') || m.relation?.toLowerCase().includes('dr'));
  const familyOnly = familyMembers.filter(m => !m.relation?.toLowerCase().includes('doctor') && !m.relation?.toLowerCase().includes('dr'));

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 ease-in-out ${isDarkMode
        ? "bg-slate-950 text-white"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-slate-800"
        }`}
    >
      {/* ================= TOP BAR ================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-indigo-100 dark:border-slate-800 shadow-sm pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Go Back"
            >
              <ArrowLeft size={20} className="sm:text-[24px] text-slate-600 dark:text-slate-300" />
            </motion.button>

            <div className="overflow-hidden">
              <p className="text-[10px] sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <h1 className={`font-bold text-slate-900 dark:text-white truncate ${fontSize === "large" ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>
                Hi, <span className="text-emerald-500 font-extrabold">{userName}</span>
              </h1>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 shrink-0">
             {/* Centered Connection Code displaying as requested - only for elders */}
            {connectionCode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <span className="hidden sm:inline text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest leading-none mb-1">Family Code</span>
                  <span className="text-sm sm:text-lg font-mono font-black text-emerald-700 dark:text-white tracking-widest leading-none">{connectionCode}</span>
                </div>
                <button 
                   onClick={shareCode}
                   className="p-1 sm:p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300 transition-colors"
                >
                  <Sparkles size={14} className="sm:w-4 sm:h-4" />
                </button>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setFontSize(fontSize === "normal" ? "large" : "normal")
              }
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 font-bold text-base sm:text-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors"
              aria-label="Toggle Font Size"
            >
              A+
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} className="sm:hidden" /> : <Moon size={20} className="sm:hidden" />}
              {isDarkMode ? <Sun size={24} className="hidden sm:block" /> : <Moon size={24} className="hidden sm:block" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100 dark:bg-slate-700 overflow-hidden shadow-lg border-2 border-white dark:border-slate-600 flex items-center justify-center"
              aria-label="Profile"
            >
              <User size={20} className="sm:text-[24px] text-indigo-500 dark:text-indigo-300" />
            </motion.button>
          </div>
        </div>
      </header >

      {/* ================= MAIN ================= */}
      < motion.main
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-10 pb-40"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        < div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8" >
          {/* -------- LEFT (PRIMARY) -------- */}
          < section className="lg:col-span-2 space-y-6 sm:space-y-8" >
            {/* HERO */}
            < motion.div variants={itemVariants} >
              <Link to="/chat">
                <motion.div
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-xl"
                >
                  <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
                    <MessageCircleHeart size={140} className="sm:w-[200px] sm:h-[200px]" fill="currentColor" />
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 mb-4 sm:mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-[10px] sm:text-xs font-bold tracking-widest">AI COMPANION</p>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight">
                      Talk to <span className="text-white">Mira</span>
                    </h2>
                    <p className="text-base sm:text-lg opacity-90 max-w-lg font-medium leading-relaxed mb-6 sm:mb-8">
                      I'm your friendly companion. Ready to chat, answer questions, or just listen!
                    </p>
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-lg underline underline-offset-4 decoration-white/40 group-hover:decoration-white transition-all">
                      <span>Start Chatting</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div >

            <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl">
              <CameraMonitor />
            </motion.div>

            < div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" >
              < motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-slate-900 border border-slate-700 shadow-lg relative overflow-hidden text-white min-h-[140px] flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ClockWidget />
                </div>
                <div className="relative z-10">
                  <p className="text-slate-400 font-semibold mb-1 text-sm uppercase tracking-wider">Current Time</p>
                  <RealTimeClock />
                </div>
              </motion.div >

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900 dark:to-blue-900 border border-blue-100 dark:border-slate-700 shadow-md min-h-[140px] flex flex-col justify-center"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-800 dark:text-sky-200 font-bold mb-1 uppercase text-xs tracking-wider">Weather</p>
                    <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">72° <span className="text-base text-slate-500 dark:text-slate-300 font-medium">Sunny</span></p>
                    <p className="text-[10px] text-sky-700 dark:text-sky-300 mt-1 uppercase font-semibold">New York City</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-sky-800/50 rounded-2xl text-sky-600 dark:text-sky-100 shadow-sm border border-white/20">
                    <CloudSun size={32} />
                  </div>
                </div>
              </motion.div>
            </div >

            < motion.div
              variants={itemVariants}
              className="rounded-3xl sm:rounded-[2rem] p-6 sm:p-10 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700/50 w-full"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className={`font-bold text-slate-800 dark:text-white ${cardTitle}`}>
                  Medicine Reminders
                </h3>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full text-rose-500">
                  <Pill size={24} />
                </div>
              </div>
              <MedicineList />
            </motion.div >

            <motion.div
              variants={itemVariants}
              className="rounded-3xl sm:rounded-[2rem] p-6 sm:p-10 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700/50 w-full"
            >
              <h3 className={`font-bold text-slate-800 dark:text-white mb-6 sm:mb-8 ${cardTitle} flex items-center gap-3`}>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Stethoscope className="text-blue-500" size={24} />
                </div>
                Call Doctor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {doctors.length > 0 ? (
                  doctors.map((doc, i) => (
                    <motion.a
                      key={i}
                      href={`tel:${doc.phone}`}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(219, 234, 254, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-left transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                        {doc.photoURL ? (
                          <img src={doc.photoURL} alt={doc.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={24} className="text-white" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-tight">{doc.phone}</p>
                      </div>
                    </motion.a>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="font-medium">No doctors configured.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </section >

          {/* -------- RIGHT (SIDE ACTIONS) -------- */}
          < aside className="space-y-6 sm:space-y-8" >
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg space-y-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <Heart size={20} className="text-rose-500" fill="currentColor" />
                </div>
                Call Family
              </h3>

              <div className="space-y-3">
                {emergencyContact && (
                  <motion.a
                    href={`tel:${emergencyContact}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none transition-all group"
                  >
                    <div className="p-2.5 bg-white/20 rounded-full animate-bounce">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Emergency</p>
                      <p className="text-xs text-white/80 font-medium">Quick Dial Family</p>
                    </div>
                  </motion.a>
                )}

                {familyOnly.map((member, i) => (
                  <motion.a
                    key={i}
                    href={`tel:${member.phone}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 shadow-sm">
                      {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : <User size={24} className="m-3 text-slate-400" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate italic">{member.relation}</p>
                    </div>
                  </motion.a>
                ))}

                {familyOnly.length === 0 && !emergencyContact && (
                  <div className="text-center py-6">
                     <p className="text-sm text-slate-400">Add family in your profile.</p>
                  </div>
                )}
              </div>
            </div>

            <motion.div
              variants={itemVariants}
              className="rounded-3xl p-6 sm:p-8 bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 shadow-md"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center justify-between text-base sm:text-lg">
                Quick Stats
                <LogOut size={16} className="text-slate-300 dark:text-slate-600" />
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mood</span>
                  <span className="text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full text-xs shrink-0">😊 Happy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Safe Zone</span>
                  <span className="text-teal-600 font-bold bg-teal-100 dark:bg-teal-900/40 px-3 py-1 rounded-full text-xs shrink-0">🏠 Inside</span>
                </div>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900 text-rose-500 dark:text-rose-400 font-bold flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
            >
              <LogOut size={20} />
              Log Out
            </motion.button>
          </aside >
        </div >
      </motion.main >

      {/* ================= EMERGENCY ================= */}
      < motion.div
        className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 pointer-events-none pb-safe"
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 80 }}
      >
        <div className="max-w-xl w-full pointer-events-auto transform hover:scale-105 transition-transform duration-300 active:scale-95">
          <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full translate-y-4" />
          <EmergencyButton />
        </div>
      </motion.div >
    </div >
  );
};