import { useState, useEffect } from 'react';

export const RealTimeClock = () => {
    const [time, setTime] = useState(new Date());
    const [location, setLocation] = useState("📍 Loading...");

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleLocationChange = (e: any) => {
            if (e.detail?.locationName) {
                setLocation(e.detail.locationName);
            }
        };
        window.addEventListener('elder-location-change', handleLocationChange);
        return () => window.removeEventListener('elder-location-change', handleLocationChange);
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation("Location not available");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&limit=1&appid=b286e5ac1f42b84a2886722a20217363`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const finalName = [data[0].name, data[0].state, data[0].country].filter(Boolean).join(", ");
                        setLocation(`📍 ${finalName}`);
                    } else {
                        setLocation("📍 Location found");
                    }
                } catch (err) {
                    setLocation("Location not available");
                }
            },
            () => {
                setLocation("Location not available");
            }
        );
    }, []);

    return (
        <div className="flex flex-col gap-0.5 mt-1">
            <p className="text-4xl font-bold text-white tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
            <p className="text-base font-medium text-slate-200 mt-1">
                {time.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}
            </p>
            <p className="text-sm font-medium text-slate-300">
                {time.toLocaleDateString('en-IN', {
                    weekday: 'long'
                })}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-1">
                {location}
            </p>
        </div>
    );
};

export const ClockWidget = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
