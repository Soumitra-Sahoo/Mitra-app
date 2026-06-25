import React from 'react'
import { menuItemsData } from '../assets/assets'
import { NavLink } from 'react-router-dom'

const MenuItems = ({ setSidebarOpen, unreadCount = 0, setUnreadCount }) => {
  return (
    <div className='px-6 text-gray-600 space-y-1 font-medium'>
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => {
            setSidebarOpen(false);
            if (to === '/notifications' && setUnreadCount) setUnreadCount(0);
          }}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
            ${isActive
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200'
              : 'text-slate-600 hover:bg-slate-100 hover:translate-x-1'
            }`
          }
        >
          <Icon className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          {label}
          {/* Notification badge */}
          {label === 'Notifications' && unreadCount > 0 && (
            <span className='ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  )
}

export default MenuItems