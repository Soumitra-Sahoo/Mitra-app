import React from 'react'

const Loading = () => {
  return (
    <div className='p-6 space-y-6'>
      {[1,2,3].map((item) => (
        <div
          key={item}
          className='bg-white dark:bg-slate-900 rounded-3xl p-5 animate-pulse shadow'
        >
          <div className='flex gap-3 items-center'>
            <div className='w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700'></div>

            <div>
              <div className='w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded'></div>
              <div className='w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded mt-2'></div>
            </div>
          </div>

          <div className='h-4 bg-slate-200 dark:bg-slate-700 rounded mt-5'></div>
          <div className='h-4 bg-slate-200 dark:bg-slate-700 rounded mt-3'></div>

          <div className='h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl mt-5'></div>
        </div>
      ))}
    </div>
  )
}

export default Loading