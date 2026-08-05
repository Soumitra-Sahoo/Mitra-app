import React from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'

const Notification = ({t, message}) => {
const navigate = useNavigate();

  return (
    <div className={`max-w-md w-full bg-card shadow-lg rounded-lg flex border border-border hover:scale-105 transition`}>
        <div className='flex-1 p-4'>
            <div className='flex items-start'>
                <img src={message.from_user_id.profile_picture} className='size-10 rounded-full flex-shrink-0 mt-0.5' alt="" />
                <div className='ml-3 flex-1'>
                    <p className='text-sm font-medium text-foreground'>{message.from_user_id.full_name}</p>
                    <p className='text-sm text-foreground-secondary'>{(message.text || 'Sent a photo').slice(0, 50)}</p>
                </div>
            </div>
        </div>
        <div className='flex border-l border-border'>
            <button onClick={()=>{
                navigate(message.group_id ? `/messages/group/${message.group_id}` : `/messages/${message.from_user_id._id}`);
                toast.dismiss(t.id);
            }} className='p-4 text-primary font-semibold'>
                Reply
            </button>
        </div>
    </div>
  )
}

export default Notification