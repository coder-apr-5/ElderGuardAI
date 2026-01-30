import { useState, useEffect, useRef } from 'react';
import { FeedbackSection } from '@/components/landing/FeedbackSection';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Shield, Heart, Brain, Eye, Bell, Calendar, Users, ChevronDown,
    ArrowRight, Play, Star, Menu, X, Quote, Target, Sparkles,
    CheckCircle2, Phone, Mail, MapPin, Twitter, Facebook, Linkedin, Instagram, User,
    Bot, Pill, HeartHandshake, AlertTriangle, Activity, Lock
} from 'lucide-react';
import HandshakeImg from '../assets/elder-robot-handshake.png';

// Brand Colors
const colors = {
    deepTrustBlue: '#1E40AF',
    warmCareTeal: '#14B8A6',
    softElderBeige: '#F5F1E8',
    lifeGreen: '#10B981',
    alertAmber: '#F59E0B',
    pureWhite: '#FFFFFF',
    deepCharcoal: '#1F2937',
};

// Header Component
const Header = ({ scrolled }: { scrolled: boolean }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navLinks = ['Features', 'How It Works', 'Testimonials', 'Mission', 'Contact'];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                {/* Logo */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}>
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg md:text-xl font-bold" style={{ color: scrolled ? colors.deepTrustBlue : colors.pureWhite, fontFamily: "'Courier New', monospace" }}>
                        ElderGuardAI
                    </span>
                </motion.div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link}
                            href={`#${link.toLowerCase().replace(' ', '-')}`}
                            className={`font-medium transition-colors hover:text-teal-500 ${scrolled ? 'text-gray-600' : 'text-white/80 hover:text-white'}`}
                        >
                            {link}
                        </a>
                    ))}
                </nav>

                {/* CTA Button */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}
                >
                    Get Started <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Mobile Menu Button */}
                <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className={scrolled ? 'text-gray-800' : 'text-white'} /> : <Menu className={scrolled ? 'text-gray-800' : 'text-white'} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-t"
                    >
                        <div className="px-6 py-4 space-y-4">
                            {navLinks.map((link) => (
                                <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="block py-3 text-gray-700 font-medium border-b" onClick={() => setMobileMenuOpen(false)}>
                                    {link}
                                </a>
                            ))}
                            <button onClick={() => { setMobileMenuOpen(false); document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full py-4 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}>
                                Get Started
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

// Hero Section
const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue} 0%, ${colors.warmCareTeal} 100%)` }}>
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
                {/* Content */}
                <div className="text-white">
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-teal-200 uppercase tracking-widest text-sm font-medium mb-4">
                        Welcome to the Future of Elder Care
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                        AI-Powered Care That <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, ${colors.alertAmber}, ${colors.lifeGreen})` }}>Sees What Others Miss</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-white/80 mb-8 max-w-lg">
                        Predictive monitoring for elderly loved ones. Real-time alerts. Peace of mind for families. Prevention before emergencies happen.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4 mb-8">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-full font-bold text-lg shadow-2xl">
                            Get Started <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-8 py-4 border-2 border-white/40 text-white rounded-full font-semibold hover:bg-white/10">
                            <Play className="w-5 h-5" /> Watch Demo
                        </motion.button>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-4 text-white/70">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 border-2 border-white" />)}
                        </div>
                        <span className="text-sm">Trusted by <strong className="text-white">10,000+</strong> families worldwide</span>
                    </motion.div>
                </div>

                {/* Hero Visual */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative hidden lg:block">
                    <div className="relative w-full aspect-square max-w-lg mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl backdrop-blur-sm border border-white/30" />
                        <div className="absolute inset-8 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mb-4 w-full h-full">
                                    <img src={HandshakeImg} alt="Elder and Robot Handshake" className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white/20" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.a href="#features" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-2">
                <span className="text-sm">Discover More</span>
                <ChevronDown className="w-6 h-6" />
            </motion.a>
        </section>
    );
};

// Features Section
const FeaturesSection = () => {
    const features = [
        { icon: Brain, title: 'Predict Risks Early', desc: 'Advanced AI analyzes conversations, emotions, and behaviors to identify health risks before emergencies.', color: colors.deepTrustBlue, items: ['Real-time mood detection', 'Chat sentiment analysis', 'Behavioral pattern recognition', '7-day risk forecasting'] },
        { icon: Shield, title: 'Protect 24/7', desc: 'Round-the-clock monitoring through AI companions and optional camera vision. Instant alerts when something unusual is detected.', color: colors.warmCareTeal, items: ['24/7 AI companion chat', 'Fall detection', 'Inactivity monitoring', 'Emergency button access'] },
        { icon: Calendar, title: 'Prevent Emergencies', desc: 'Proactive intervention through family alerts and care recommendations. Medicine reminders and daily routine monitoring.', color: colors.lifeGreen, items: ['Medicine adherence tracking', 'Family instant alerts', 'Diet & activity monitoring', 'Personalized care insights'] },
    ];

    return (
        <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: colors.deepCharcoal }}>How ElderGuardAI Works</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Three pillars of protection for your loved ones</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, i) => (
                        <motion.div key={feature.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} whileHover={{ y: -8 }} className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${feature.color}15` }}>
                                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4" style={{ color: colors.deepCharcoal }}>{feature.title}</h3>
                            <p className="text-gray-600 mb-6">{feature.desc}</p>
                            <ul className="space-y-3">
                                {feature.items.map(item => (
                                    <li key={item} className="flex items-center gap-2 text-gray-700">
                                        <CheckCircle2 className="w-5 h-5" style={{ color: feature.color }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// How It Works Section
const HowItWorksSection = () => {
    const steps = [
        { num: 1, icon: Users, title: 'Connect Your Family', desc: 'Elder signs up with family member verification. Secure connection ensures only authorized family can monitor.', color: colors.warmCareTeal },
        { num: 2, icon: Eye, title: 'AI Monitors Daily', desc: 'Elders interact with AI companion, patterns are learned, risks are calculated automatically.', color: colors.deepTrustBlue },
        { num: 3, icon: Bell, title: 'Family Gets Alerted', desc: 'Instant push notifications and SMS for emergencies. Dashboard shows risk levels and trends.', color: colors.alertAmber },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.deepCharcoal }}>Simple 3-Step Process</h2>
                    <p className="text-lg md:text-xl text-gray-600">Getting started takes less than 5 minutes</p>
                </motion.div>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-amber-500 transform -translate-y-1/2 z-0" style={{ margin: '0 15%' }} />

                    <div className="grid md:grid-cols-3 gap-8 relative z-10">
                        {steps.map((step, i) => (
                            <motion.div key={step.num} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="text-center">
                                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl" style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)` }}>
                                    <step.icon className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ color: colors.deepCharcoal }}>{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Help Section (Elder vs Family)
const HelpSection = () => {
    const navigate = useNavigate();

    return (
        <section id="help" className="py-16 md:py-24" style={{ background: colors.softElderBeige }}>
            <div className="max-w-7xl mx-auto px-6">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: colors.deepCharcoal }}>How Can We Help You?</h2>
                    <p className="text-xl text-gray-600">Choose your path to get started</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Elder Card */}
                    <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.02 }} onClick={() => navigate('/auth/login')} className="relative overflow-hidden rounded-3xl p-6 md:p-8 cursor-pointer group" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}>
                        <div className="text-white">
                            <div className="mb-6 flex justify-center lg:justify-start">
                                <div className="p-4 bg-white/20 rounded-2xl w-fit backdrop-blur-sm">
                                    <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">I'm a Senior</h3>
                            <p className="text-white/80 mb-6">Get your personal AI companion. Chat anytime, get reminders, and stay connected with family who care.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    { icon: Bot, text: 'Friendly AI to talk to' },
                                    { icon: Pill, text: 'Medicine reminders' },
                                    { icon: HeartHandshake, text: 'Family peace of mind' },
                                    { icon: AlertTriangle, text: 'Emergency button' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/90">
                                        <div className="p-1.5 bg-white/10 rounded-lg">
                                            <item.icon className="w-4 h-4 text-white" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 bg-white text-blue-900 rounded-xl font-bold text-lg group-hover:shadow-xl transition-all">Sign In as Elder</button>
                        </div>
                    </motion.div>

                    {/* Family Card */}
                    <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.02 }} onClick={() => navigate('/auth/login?role=family')} className="relative overflow-hidden rounded-3xl p-6 md:p-8 cursor-pointer group" style={{ background: `linear-gradient(135deg, ${colors.warmCareTeal}, ${colors.lifeGreen})` }}>
                        <div className="text-white">
                            <div className="mb-6 flex justify-center lg:justify-start">
                                <div className="p-4 bg-white/20 rounded-2xl w-fit backdrop-blur-sm">
                                    <Users className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">I'm a Family Member</h3>
                            <p className="text-white/80 mb-6">Monitor your elderly loved ones. Get instant alerts, view health trends, and ensure they're safe - even from afar.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    { icon: Activity, text: 'Real-time dashboard' },
                                    { icon: AlertTriangle, text: 'Instant emergency alerts' },
                                    { icon: Heart, text: 'Health trend analysis' },
                                    { icon: Lock, text: 'Secure & private' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/90">
                                        <div className="p-1.5 bg-white/10 rounded-lg">
                                            <item.icon className="w-4 h-4 text-white" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 bg-white text-teal-900 rounded-xl font-bold text-lg group-hover:shadow-xl transition-all">Sign in as Family</button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Testimonials Section
const TestimonialsSection = () => {
    const [current, setCurrent] = useState(0);
    const testimonials = [
        { quote: "ElderGuardAI detected my father's mood decline days before we noticed anything wrong. The alert gave us time to intervene and get him help. This app literally saved his life.", name: 'Sarah Chen', relation: 'Daughter of Robert, 81', location: 'San Francisco, CA' },
        { quote: "I live 3,000 miles away from my mom. ElderGuardAI lets me sleep peacefully knowing she's monitored 24/7. The AI companion keeps her company, and I get instant alerts if anything's wrong.", name: 'Michael Torres', relation: 'Son of Elena, 76', location: 'New York, NY' },
        { quote: "As an 80-year-old living alone, I was skeptical about AI. But the companion chat feels like talking to a caring friend. It reminds me about my medicines and my daughter can check on me anytime.", name: 'Dorothy Williams', relation: 'Elder User, 80', location: 'Austin, TX' },
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="testimonials" className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: colors.deepCharcoal }}>Trusted by Families Worldwide</h2>
                    <p className="text-xl text-gray-600">Real stories from real people whose lives we've touched</p>
                </motion.div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
                            <Quote className="w-12 h-12 mb-6" style={{ color: `${colors.warmCareTeal}30` }} />
                            <p className="text-xl md:text-2xl text-gray-700 italic mb-8 leading-relaxed">"{testimonials[current].quote}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-blue-500" />
                                <div>
                                    <p className="font-bold text-gray-800">{testimonials[current].name}</p>
                                    <p className="text-gray-500 text-sm">{testimonials[current].relation}</p>
                                    <p className="text-gray-400 text-xs">{testimonials[current].location}</p>
                                </div>
                                <div className="ml-auto flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}</div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`w-3 h-3 rounded-full transition-all ${i === current ? 'w-8' : ''}`} style={{ backgroundColor: i === current ? colors.warmCareTeal : '#e5e7eb' }} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Mission & Vision Section
const MissionVisionSection = () => (
    <section id="mission" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl p-10 text-white" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, #1e3a8a)` }}>
                    <Target className="w-12 h-12 mb-6" />
                    <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
                    <p className="text-white/90 text-lg leading-relaxed mb-6">To prevent elderly emergencies before they happen through predictive AI monitoring. We believe every senior deserves to age safely, independently, and with dignity - while families gain peace of mind.</p>
                    <ul className="space-y-3">
                        {['Zero preventable emergencies', 'Independent living support', 'Family peace of mind', 'Accessible AI technology'].map(item => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-teal-300" />{item}</li>)}
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl p-10 text-white" style={{ background: `linear-gradient(135deg, ${colors.warmCareTeal}, ${colors.lifeGreen})` }}>
                    <Eye className="w-12 h-12 mb-6" />
                    <h3 className="text-3xl font-bold mb-6">Our Vision</h3>
                    <p className="text-white/90 text-lg leading-relaxed mb-6">A world where AI companions are as common as smartphones for elderly care. Where technology predicts health risks days before crisis, families stay connected effortlessly, and no senior ever feels alone.</p>
                    <ul className="space-y-3">
                        {['AI in every senior\'s home', 'Predictive healthcare standard', 'Connected care ecosystem', 'Eliminate elderly loneliness'].map(item => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white/80" />{item}</li>)}
                    </ul>
                </motion.div>
            </div>
        </div>
    </section>
);

// Quote Section
const QuoteSection = () => (
    <section className="py-24" style={{ background: `linear-gradient(135deg, ${colors.warmCareTeal}, ${colors.deepTrustBlue})` }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Quote className="w-16 h-16 mx-auto mb-8 text-white/30" />
                <p className="text-2xl md:text-4xl text-white font-light leading-relaxed mb-8">"Technology should enhance human connection, not replace it. ElderGuardAI brings families closer, even when miles apart."</p>
                <p className="text-white/70 text-lg italic">— The ElderGuardAI Team</p>
            </motion.div>
        </div>
    </section>
);

// Final CTA Section
const CTASection = () => {
    const navigate = useNavigate();

    return (
        <section className="py-24" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}>
            <div className="max-w-4xl mx-auto px-6 text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <p className="text-white/70 uppercase tracking-widest text-sm mb-4">Ready to Protect Your Loved Ones?</p>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Join 10,000+ Families Using ElderGuardAI Today</h2>
                    <p className="text-xl text-white/80 mb-10">Start your free 14-day trial. No credit card required. Set up in 5 minutes.</p>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-3 px-12 py-5 bg-white rounded-full font-bold text-xl shadow-2xl" style={{ color: colors.deepTrustBlue }}>
                        <Sparkles className="w-6 h-6" /> Get Started Free <ArrowRight className="w-6 h-6" />
                    </motion.button>

                    <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/80 text-sm">
                        {['✓ Free 14-day trial', '✓ No credit card needed', '✓ Cancel anytime'].map(item => <span key={item}>{item}</span>)}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// Footer
const Footer = () => (
    <footer className="py-16" style={{ backgroundColor: colors.deepCharcoal }}>
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
                {/* Brand */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.deepTrustBlue}, ${colors.warmCareTeal})` }}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xl font-bold" style={{ fontFamily: "'Courier New', monospace" }}>ElderGuardAI</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Predict. Protect. Prevent.<br />AI-powered predictive care for seniors.</p>
                    <div className="flex gap-4">
                        {[Twitter, Facebook, Linkedin, Instagram].map((Icon, i) => <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-all"><Icon className="w-5 h-5" /></a>)}
                    </div>
                </div>

                {/* Links */}
                {[
                    { title: 'Product', links: ['Features', 'How It Works', 'Pricing', 'Security', 'FAQ'] },
                    { title: 'Company', links: ['About Us', 'Mission', 'Careers', 'Press', 'Contact'] },
                    { title: 'Support', links: ['Help Center', 'Getting Started', 'Terms', 'Privacy', 'Accessibility'] },
                ].map(col => (
                    <div key={col.title}>
                        <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                        <ul className="space-y-3">
                            {col.links.map(link => <li key={link}><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{link}</a></li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                <p>© 2026 ElderGuardAI. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white">Privacy</a>
                    <a href="#" className="hover:text-white">Terms</a>
                    <a href="#" className="hover:text-white">Cookies</a>
                </div>
            </div>
        </div>
    </footer>
);

// Main Landing Page Component
const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Header scrolled={scrolled} />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <HelpSection />
            <TestimonialsSection />
            <MissionVisionSection />
            <QuoteSection />
            <CTASection />
            <FeedbackSection />
            <Footer />
        </div>
    );
};

export default LandingPage;
