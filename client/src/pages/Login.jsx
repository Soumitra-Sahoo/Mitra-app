import React from 'react'
import { assets } from '../assets/assets'
import { Star } from 'lucide-react'
import { SignIn } from "@clerk/clerk-react"
import { dark } from "@clerk/themes"
import { useTheme } from '../context/ThemeContext.jsx'

const Login = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-slate-950'>
      <img
        src={assets.bgImage}
        alt=""
        className='absolute top-0 left-0 -z-1 w-full h-full object-cover dark:brightness-[0.35]'
      />

      {/* left side : Branding */}
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
      <img src={assets.logo} alt="" className='h-12 object-contain'/>
      <div>
        <div className='flex items-center gap-3 mb-4 max-md:mt-10'>
          <img src={assets.group_users} alt="" className='h-8 md:h-10'/>
          <div>
            <div className='flex'>
              {Array(5).fill(0).map((_, i) => (<Star key={i} className='size-4 md:size-4.5 text-transparent fill-amber-500'/>))}
            </div>
            <p className='text-slate-700 dark:text-slate-300'>Developed by Soumitra</p>
          </div>
        </div>
        <h1 className='text-3xl md:text-6xl md:pb-2 font-bold text-blue-700 dark:text-blue-300'>Make relation and bonding with yours</h1>
        <p className='text-xl md:text-3xl text-blue-900 dark:text-blue-200 max-w-72 md:max-w-md'>Connect with Mitra App</p>
      </div>
      <span className='md:h-10'></span>
      </div>
      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
        <SignIn
          appearance={{
            baseTheme: resolvedTheme === 'dark' ? dark : undefined,
          }}
        />
      </div>
    </div>
  )
}

export default Login