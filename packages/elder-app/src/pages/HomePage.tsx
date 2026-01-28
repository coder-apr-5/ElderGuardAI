import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmergencyButton } from "@/features/emergency/EmergencyButton";
import { MoodSelector } from "@/features/mood/MoodSelector";
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
  ArrowLeft
} from "lucide-react";
import { CameraMonitor } from "@/features/camera";

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
          </div>
        </div>

        {/* ===== FAMILY CONNECTION CODE BAR ===== */}
        {connectionCode && showBanner && (
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
        )}
      </header>

      {/* ================= MAIN ================= */}
      <motion.main
        className="max-w-7xl mx-auto px-6 py-8 space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* TOP ROW: HERO + OVERVIEW + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* -------- LEFT (PRIMARY) -------- */}
          <section className="lg:col-span-2 space-y-8">
            {/* HERO */}
            <motion.div variants={itemVariants}>
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
            </motion.div>

            {/* CAMERA MONITORING PART (REAL-TIME) */}
            <motion.div variants={itemVariants}>
              <CameraMonitor />
            </motion.div>

            {/* OVERVIEW CARDS */}
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 border border-orange-100 dark:border-slate-700 shadow-lg shadow-orange-100/50 dark:shadow-none"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-orange-800 dark:text-orange-400 font-semibold mb-1">Next Medicine</p>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">2:00 <span className="text-lg text-slate-500 font-medium">PM</span></p>
                  </div>
                  <div className="p-3 bg-orange-200 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                    <Pill size={32} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="rounded-3xl p-6 bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 shadow-lg shadow-blue-100/50 dark:shadow-none"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sky-800 dark:text-sky-400 font-semibold mb-1">Weather</p>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">72° <span className="text-lg text-slate-500 font-medium">Sunny</span></p>
                  </div>
                  <div className="p-3 bg-sky-200 dark:bg-sky-900/30 rounded-2xl text-sky-600 dark:text-sky-400">
                    <CloudSun size={32} />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* -------- RIGHT (SIDE ACTIONS) -------- */}
          <aside className="space-y-6">
            <motion.a
              href={emergencyContact ? `tel:${emergencyContact}` : undefined}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="block rounded-3xl p-8 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                <Phone size={100} fill="currentColor" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                  <Phone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Call Family</h3>
                  <p className="opacity-90 mt-1 font-medium bg-blue-700/30 inline-block px-2 py-0.5 rounded-lg text-sm">
                    One-tap calling
                  </p>
                </div>
              </div>
            </motion.a>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left rounded-3xl p-8 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-200 dark:shadow-none relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                <Stethoscope size={100} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                  <Stethoscope size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Call Doctor</h3>
                  <p className="opacity-90 mt-1 font-medium bg-rose-700/30 inline-block px-2 py-0.5 rounded-lg text-sm">
                    Medical support
                  </p>
                </div>
              </div>
            </motion.button>
          </aside>
        </div>

        {/* FULL WIDTH SECTION: MOOD */}
        <motion.div
          variants={itemVariants}
          className="rounded-[2rem] p-10 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 dark:bg-slate-700 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
          <h3 className={`font-bold text-slate-800 dark:text-white mb-8 relative z-10 ${cardTitle}`}>
            How are you feeling today?
          </h3>
          <div className="relative z-10">
            <MoodSelector />
          </div>
        </motion.div>

        {/* FULL WIDTH SECTION: MEDICINE */}
        <motion.div
          variants={itemVariants}
          className="rounded-[2rem] p-10 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 w-full"
        >
          <h3 className={`font-bold text-slate-800 dark:text-white mb-8 ${cardTitle}`}>
            Today’s Medicine
          </h3>
          <MedicineList />
        </motion.div>
      </motion.main>

      {/* ================= EMERGENCY ================= */}
      <motion.div
        className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 pointer-events-none"
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 80 }}
      >
        <div className="max-w-xl w-full pointer-events-auto transform hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full translate-y-4" />
          <EmergencyButton />
        </div>
      </motion.div>
    </div>
  );
};

