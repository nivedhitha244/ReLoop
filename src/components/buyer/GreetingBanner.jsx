import React from 'react';
import { Leaf, MapPin, SunMedium } from 'lucide-react';

export default function GreetingBanner({ user }) {
  const displayName = user?.name || user?.fullName || 'there';
  const dateStr = user?.weather?.date || new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const locationStr = user?.location || "Chennai, Tamil Nadu";
  const tempStr = user?.weather?.temp || "32°C";
  const conditionStr = user?.weather?.condition || "Partly cloudy";

  return (
    <section className="greeting-banner-card">
      {/* Background soft leaf overlay */}
      <div className="banner-leaf-bg">
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 10C80 25 120 70 140 110C100 110 60 90 40 50C35 40 40 20 50 10Z"
            fill="#10b981"
            fillOpacity="0.15"
          />
          <path
            d="M110 5C140 25 170 60 190 100C160 95 130 80 115 50C110 40 105 20 110 5Z"
            fill="#059669"
            fillOpacity="0.12"
          />
        </svg>
      </div>

      <div className="banner-left-content">
        <div className="leaf-badge-icon">
          <Leaf size={22} className="leaf-svg" />
        </div>
        <div className="banner-titles">
          <h1 className="banner-heading">Welcome, {displayName}!</h1>
          <p className="banner-subtext">Find, request and track reusable water for a greener tomorrow.</p>
        </div>
      </div>

      <div className="banner-right-meta">
        <span className="meta-item meta-date">{dateStr}</span>

        <span className="meta-item meta-location">
          <MapPin size={14} className="meta-icon" />
          <span>{locationStr}</span>
        </span>

        <div className="weather-pill">
          <SunMedium size={18} className="weather-sun-icon" />
          <div className="weather-text">
            <span className="weather-temp">{tempStr}</span>
            <span className="weather-condition">{conditionStr}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
