import React from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'

const Notification = ({t, message}) => {

    const navigate = useNavigate();

  return (
    <div className={`max-w-md w-full bg-white dark:bg-slate-900 shadow-lg rounded-lg flex border border-gray-300 dark:border-slate-600 hover:scale-105 transition`}>
        <div className='flex-1 p-4'>
            <div className='flex items-start'>
                <img src={message.from_user_id.profile_picture} className='size-10 rounded-full flex-shrink-0 mt-0.5' alt="" />
                <div className='ml-3 flex-1'>
                    <p className='text-sm font-medium text-gray-900 dark:text-slate-100'>{message.from_user_id.full_name}</p>
                    <p className='text-sm text-gray-500 dark:text-slate-400'>{message.text.slice(0, 50)}</p>
                </div>
            </div>
        </div>
        <div className='flex border-l border-gray-200 dark:border-slate-700'>
            <button onClick={()=>{
                navigate(`/messages/${message.from_user_id._id}`);
                toast.dismiss(t.id);
            }} className='p-4 text-indigo-600 font-semibold'>
                Reply
            </button>
        </div>
    </div>
  )
}

export default Notification