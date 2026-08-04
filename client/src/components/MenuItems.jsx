import React from 'react'
import { menuItemsData } from '../assets/assets'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const MenuItems = ({ setSidebarOpen, unreadCount = 0, setUnreadCount }) => {
  const location = useLocation();

  return (
    <div className='px-6 text-foreground-secondary space-y-1 font-medium'>
      {menuItemsData.map(({ to, label, Icon }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => {
              setSidebarOpen(false);
              if (to === '/notifications' && setUnreadCount) setUnreadCount(0);
            }}
            className='group relative flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden'
          >
            {isActive && (
              <motion.div
                layoutId="activeNavPill"
                className="absolute inset-0 bg-gradient-to-r from-gradient-start to-gradient-end shadow-lg shadow-primary/20"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon
              className={`relative w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : ""}`}
            />
            <span className={`relative ${isActive ? "text-white" : ""}`}>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className='relative ml-auto bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  )
}

export default MenuItems
