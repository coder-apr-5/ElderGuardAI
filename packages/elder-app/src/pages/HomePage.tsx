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
  User
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
        const { auth, db } = await import("@elder-nest/shared");
        const { doc, getDoc } = await import("firebase/firestore");
        const user = auth.currentUser;
        if (!user) return;

        setUserName(user.displayName?.split(" ")[0] || "Friend");

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setConnectionCode(data.connectionCode);
          setEmergencyContact(data.emergencyContact);
          setFamilyMembers(data.manualFamilyMembers || []);
        }
      } catch (e) {
        console.error(e);
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
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-indigo-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Go Back"
            >
              <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
            </motion.button>

            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className={`font-bold text-slate-900 dark:text-white ${heading}`}>
                Welcome,{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                  {userName}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setFontSize(fontSize === "normal" ? "large" : "normal")
              }
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 font-bold text-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors"
              aria-label="Toggle Font Size"
            >
              A+
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-12 h-12 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center"
              aria-label="Logout"
            >
              <LogOut size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-slate-700 overflow-hidden shadow-lg border-2 border-white dark:border-slate-600 flex items-center justify-center"
              aria-label="Profile"
            >
              <User size={24} className="text-indigo-500 dark:text-indigo-300" />
            </motion.button>
          </div>
        </div>

        {/* ===== FAMILY CONNECTION CODE BAR ===== */}
        {
          connectionCode && showBanner && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-inner relative">
              <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap gap-4 justify-between items-center pr-12">
                <div className="flex items-center gap-2">
                  <Heart className="text-white/80" size={20} fill="currentColor" />
                  <p className="font-medium text-lg">
                    Family Code:
                    <span className="ml-3 font-mono font-bold text-xl tracking-widest bg-white/20 px-3 py-0.5 rounded-lg">
                      {connectionCode}
                    </span>
                  </p>
                </div>
                <button
                  onClick={shareCode}
                  className="px-5 py-2 rounded-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-sm shadow-sm transition-colors"
                >
                  Share Code
                </button>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close Banner"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )
        }
      </header >

      {/* ================= MAIN ================= */}
      < motion.main
        className="max-w-7xl mx-auto px-6 py-8 space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* TOP ROW: HERO + OVERVIEW + SIDEBAR */}
        < div className="grid grid-cols-1 lg:grid-cols-3 gap-8" >
          {/* -------- LEFT (PRIMARY) -------- */}
          < section className="lg:col-span-2 space-y-8" >
            {/* HERO */}
            < motion.div variants={itemVariants} >
              <Link to="/chat">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-[2.5rem] p-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-2xl shadow-indigo-200 dark:shadow-none"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
                    <MessageCircleHeart size={200} fill="currentColor" />
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 mb-6">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-sm font-bold tracking-wide">AI COMPANION</p>
                    </div>
                    <h2 className="text-5xl font-extrabold mb-4 leading-tight">
                      Talk to <span className="text-indigo-100">Mira</span>
                    </h2>
                    <p className="text-lg opacity-90 max-w-lg font-medium leading-relaxed">
                      Feeling lonely or have a question? I'm here to listen, chat, and help you with anything you need.
                    </p>
                    <div className="mt-8 flex items-center gap-3 font-bold text-white/90 group-hover:text-white transition-colors">
                      <span className="border-b-2 border-white/40 group-hover:border-white pb-0.5">Start Conversation</span>
                      →
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div >

            {/* CAMERA MONITORING PART (REAL-TIME) */}
            <motion.div variants={itemVariants}>
              <CameraMonitor />
            </motion.div>

            {/* OVERVIEW CARDS */}
            < div className="grid sm:grid-cols-2 gap-6" >
              {/* Dynamic Clock */}
              < motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-slate-900 border border-slate-700 shadow-lg relative overflow-hidden text-white"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ClockWidget />
                </div>
                <div className="relative z-10">
                  <p className="text-slate-400 font-semibold mb-1">Current Time</p>
                  <RealTimeClock />
                </div>
              </motion.div >

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900 dark:to-blue-900 border border-blue-100 dark:border-slate-700 shadow-lg shadow-blue-100/50 dark:shadow-none"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sky-800 dark:text-sky-200 font-semibold mb-1">Weather (Live)</p>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">72° <span className="text-lg text-slate-500 dark:text-slate-300 font-medium">Sunny</span></p>
                    <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">New York, USA</p>
                  </div>
                  <div className="p-3 bg-sky-200 dark:bg-sky-800 rounded-2xl text-sky-600 dark:text-sky-200">
                    <CloudSun size={32} />
                  </div>
                </div>
              </motion.div>
            </div >

            {/* FULL WIDTH SECTION: MEDICINE */}
            < motion.div
              variants={itemVariants}
              className="rounded-[2rem] p-10 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 w-full"
            >
              <h3 className={`font-bold text-slate-800 dark:text-white mb-8 ${cardTitle}`}>
                Today’s Medicine
              </h3>
              <MedicineList />
            </motion.div >

            {/* FULL WIDTH SECTION: CALL DOCTOR */}
            <motion.div
              variants={itemVariants}
              className="rounded-[2rem] p-10 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 w-full"
            >
              <h3 className={`font-bold text-slate-800 dark:text-white mb-8 ${cardTitle} flex items-center gap-3`}>
                <Stethoscope className="text-blue-500" size={32} />
                Call Doctor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doctors.length > 0 ? (
                  doctors.map((doc, i) => (
                    <motion.a
                      key={i}
                      href={`tel:${doc.phone}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center shrink-0">
                        {doc.photoURL ? (
                          <img src={doc.photoURL} alt={doc.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Stethoscope size={20} className="text-blue-600 dark:text-blue-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-800 dark:text-white">{doc.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{doc.phone}</p>
                      </div>
                    </motion.a>
                  ))
                ) : (
                  <div className="col-span-1 sm:col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    No doctors added in profile yet.
                  </div>
                )}
              </div>
            </motion.div>

          </section >

          {/* -------- RIGHT (SIDE ACTIONS & GRAPHS) -------- */}
          < aside className="space-y-6" >
            {/* CALL FAMILY SECTION (Moved to Sidebar Top for importance) */}
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Heart size={20} className="text-rose-500" fill="currentColor" />
                Call Family
              </h3>

              <div className="space-y-3">
                {emergencyContact && (
                  <motion.a
                    href={`tel:${emergencyContact}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold"
                  >
                    <div className="p-2 bg-rose-200 dark:bg-rose-800 rounded-full">
                      <Phone size={16} />
                    </div>
                    Emergency
                  </motion.a>
                )}

                {familyOnly.map((member, i) => (
                  <motion.a
                    key={i}
                    href={`tel:${member.phone}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden shrink-0">
                      {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : <User size={20} className="m-2" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.relation}</p>
                    </div>
                  </motion.a>
                ))}

                {familyOnly.length === 0 && !emergencyContact && (
                  <p className="text-sm text-slate-400 text-center py-4">No contacts added.</p>
                )}
              </div>
            </div>

            <motion.div
              variants={itemVariants}
              className="rounded-3xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Pill size={16} className="text-orange-500" /> Meds History
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Aspirin</span>
                  <span className="text-green-500 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Taken</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Vitamin D</span>
                  <span className="text-green-500 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Taken</span>
                </div>
              </div>
            </motion.div>
          </aside >
        </div >

      </motion.main >

      {/* ================= EMERGENCY ================= */}
      < motion.div
        className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 pointer-events-none"
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 80 }}
      >
        <div className="max-w-xl w-full pointer-events-auto transform hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full translate-y-4" />
          <EmergencyButton />
        </div>
      </motion.div >
    </div >
  );
};