import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { assets } from "../assets/assets.js";

const Logo = ({ className = "h-8", showText = true }) => {
  const { resolvedTheme } = useTheme();
  const icon = resolvedTheme === "dark" ? assets.logoIconDark : assets.logoIconLight;

  return (
    <div className="flex items-center gap-2">
      <img src={icon} alt="Mitra" className={`${className} w-auto object-contain rounded-lg`} />
      {showText && (
        <span className="font-heading text-xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
          Mitra
        </span>
      )}
    </div>
  );
};

export default Logo;