import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log("🔥 Splash Screen is successfully loading!");

    // The CSS animation takes 3.3 seconds total (2.5s cinematic enter + 0.8s zoom out)
    // We unmount the component entirely after 3.4s to clean up the DOM
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3400);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-logo-container">
        <div className="splash-logo">
          <img src="/logo.jpeg" alt="Gurukul Logo" className="splash-logo-img" />
          <div className="splash-brand-text">
            <h1 className="splash-logo-title">Gurukul Success Classes</h1>
            <p className="splash-logo-tagline">Aptitude Today, Success Tomorrow</p>
            {/* Animated Loading Bar */}
            <div className="splash-loading-bar">
              <div className="splash-loading-progress"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;