import { useState, useEffect, useCallback } from "react";

import {
  CloudSun,
  MapPin,
  Search,
  MapPinOff,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  Cloud,
  Loader2,
} from "lucide-react";

const OWM_API_KEY = "b286e5ac1f42b84a2886722a20217363";

type WeatherData = {
  temp: number;
  condition: string;
  city: string;
  icon: string;
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManualMode, setIsManualMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [locationDenied, setLocationDenied] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search query and fetch suggestions
  useEffect(() => {
    const handler = setTimeout(async () => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim().length > 2 && isManualMode) {
        try {
          const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${OWM_API_KEY}`);
          const data = await res.json();
          setSuggestions(data || []);
          setShowSuggestions(true);
        } catch (e) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, isManualMode]);

  const fetchWeather = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather data not found");
      const data = await res.json();
      setWeather({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        city: data.name,
        icon: data.weather[0].icon,
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const fetchWeatherByCoords = useCallback(
    (lat: number, lon: number, locationNameOverride?: string) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`;
      fetchWeather(url).then(async () => {
        // Also fetch reverse geocoding to broadcast full name if not overridden
        let finalName = locationNameOverride;
        if (!finalName) {
            try {
                const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_API_KEY}`);
                const data = await res.json();
                if (data && data.length > 0) {
                    finalName = [data[0].name, data[0].state, data[0].country].filter(Boolean).join(", ");
                }
            } catch (e) {}
        }
        if (finalName) {
            window.dispatchEvent(new CustomEvent('elder-location-change', { detail: { locationName: `📍 ${finalName}` } }));
        }
      });
    },
    [fetchWeather]
  );

  const fetchWeatherByCity = useCallback(
    (city: string) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${OWM_API_KEY}&units=metric`;
      fetchWeather(url).then(() => {
          window.dispatchEvent(new CustomEvent('elder-location-change', { detail: { locationName: `📍 ${city}` } }));
      });
    },
    [fetchWeather]
  );

  const handleSuggestionSelect = (sug: any) => {
      const finalName = [sug.name, sug.state, sug.country].filter(Boolean).join(", ");
      setSearchQuery(finalName);
      setSuggestions([]);
      setShowSuggestions(false);
      fetchWeatherByCoords(sug.lat, sug.lon, finalName);
  };

  // Initial and Auto-Update Logic
  useEffect(() => {
    if (isManualMode) {
      if (debouncedQuery.trim() !== "") {
        fetchWeatherByCity(debouncedQuery);
      }
      return;
    }

    const getLocationAndWeather = () => {
      if (!navigator.geolocation) {
        setLocationDenied(true);
        setIsManualMode(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationDenied(false);
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation Error:", err);
          setLocationDenied(true);
          setIsManualMode(true);
          if (!weather) {
            fetchWeatherByCity("New York"); // Fallback
          }
        }
      );
    };

    getLocationAndWeather();

    // Refresh every 15 minutes
    const interval = setInterval(getLocationAndWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isManualMode, debouncedQuery, fetchWeatherByCoords, fetchWeatherByCity]);

  // Map Condition to Icon
  const renderIcon = () => {
    if (loading) return <Loader2 size={32} className="animate-spin" />;
    if (!weather) return <CloudSun size={32} />;
    const c = weather.condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain size={32} />;
    if (c.includes("snow")) return <CloudSnow size={32} />;
    if (c.includes("thunder")) return <CloudLightning size={32} />;
    if (c.includes("clear")) return <Sun size={32} />;
    if (c.includes("cloud")) return <Cloud size={32} />;
    return <CloudSun size={32} />;
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sky-800 dark:text-sky-200 font-bold uppercase text-xs tracking-wider">
              Weather
            </p>
            {loading && <span className="flex w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
          </div>

          <div className="min-h-[48px]">
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
            {!error && weather && (
              <>
                <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white flex items-end gap-1">
                  {weather.temp}°C
                  <span className="text-base text-slate-500 dark:text-slate-300 font-medium pb-1">
                    {weather.condition}
                  </span>
                </p>
                <p className="text-[10px] text-sky-700 dark:text-sky-300 mt-1 uppercase font-semibold flex items-center gap-1">
                  {isManualMode ? <MapPinOff size={10} /> : <MapPin size={10} />}
                  {weather.city}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="p-3 bg-white/50 dark:bg-sky-800/50 rounded-2xl text-sky-600 dark:text-sky-100 shadow-sm border border-white/20 shrink-0">
          {renderIcon()}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="pt-2 border-t border-sky-200 dark:border-sky-800/50">
        {!isManualMode ? (
          <button
            onClick={() => setIsManualMode(true)}
            className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-300 hover:text-sky-800 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <Search size={12} /> Search Location
          </button>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter city name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-1.5 pl-7 pr-2 rounded-md bg-white/50 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              />
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden">
                  {suggestions.map((sug, idx) => {
                    const fullName = [sug.name, sug.state, sug.country].filter(Boolean).join(", ");
                    return (
                      <li
                        key={idx}
                        onClick={() => handleSuggestionSelect(sug)}
                        className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer truncate transition-colors"
                      >
                        {fullName}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <button
              onClick={() => {
                setIsManualMode(false);
                setSearchQuery("");
                if (locationDenied) {
                  // If location denied, prompt or handle gracefully
                  alert("Location access is denied. Please enable it in your browser.");
                }
              }}
              className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-300 hover:text-sky-800 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <MapPin size={12} /> Use My Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
