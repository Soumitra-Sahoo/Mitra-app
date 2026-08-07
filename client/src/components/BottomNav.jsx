import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { menuItemsData } from "../assets/assets";

const BOTTOM_NAV_PATHS = [
  "/",
  "/messages",
  "/notifications",
  "/profile",
];

const items = BOTTOM_NAV_PATHS.map((path) =>
  menuItemsData.find((item) => item.to === path)
).filter(Boolean);

const BottomNav = ({ notificationCount, messageCount }) => {
  const location = useLocation();
  const badgeFor = (to) => {
    if (to === "/messages") return messageCount;
    if (to === "/notifications") return notificationCount;
    return 0;
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-navbar backdrop-blur-md border-t border-border flex items-center justify-around">
      {items.map(({ to, label, Icon }) => {
        const badge = badgeFor(to);
        const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition ${
              isActive ? "text-primary" : "text-foreground-secondary"
            }`}
          >
            <div className="relative">
              <Icon className="size-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full bg-danger text-white text-[9px] font-bold">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
            {isActive && (
              <motion.div
                layoutId="activeBottomNavDot"
                className="absolute -top-0.5 size-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;