import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Phone, Video, PhoneMissed, PhoneOff, Image as ImageIcon } from 'lucide-react';

const getMessagePreview = (message) => {
  if (message.text) {
    return { label: message.text, Icon: null };
  }
  if (message.message_type === 'call') {
    if (message.call_status === 'missed') {
      return { label: 'Missed call', Icon: PhoneMissed };
    }
    if (message.call_status === 'declined') {
      return { label: 'Call declined', Icon: PhoneOff };
    }
    if (message.call_status === 'cancelled') {
      return { label: 'Call cancelled', Icon: PhoneOff };
    }
    return message.call_type === 'video'
      ? { label: 'Video call', Icon: Video }
      : { label: 'Voice call', Icon: Phone };
  }
  return { label: 'Media', Icon: ImageIcon };
};

const RecentMessages = () => {

    const [messages, setMessages] = useState([]);
    const { user } = useUser();
    const { getToken } = useAuth();

    const fetchRecentMessages = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/recent-messages', {
                headers: {Authorization: `Bearer ${token}`}
            })
            if(data.success){
                const groupedMessages = data.messages.reduce((acc, message)=>{
                    const senderId = message.from_user_id._id;
                    if(!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt)){
                        acc[senderId] = message;
                    }
                    return acc;
                }, {})

                const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setMessages(sortedMessages)
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(()=>{
        if(user){
            fetchRecentMessages();
            const interval = setInterval(fetchRecentMessages, 30000);
            return () => clearInterval(interval);
        }
    },[user]);

  return (
    <div className='bg-white dark:bg-slate-900 max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800 dark:text-slate-100'>
        <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-4'>Recent Messages</h3>
        <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
            {
                messages.map((message, index) => {
                    const { label, Icon } = getMessagePreview(message);
                    return (
                    <Link to={`/messages/${message.from_user_id._id}`} key={index} className='flex items-start rounded-md gap-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-2'>
                        <img src={message.from_user_id.profile_picture} className='size-8 rounded-full aspect-square object-cover' alt="" />
                        <div className='w-full'>
                            <div className='flex justify-between'>
                                <p className='font-medium text-slate-900 dark:text-slate-100'>{message.from_user_id.full_name}</p>
                                <p className='text-[10px] text-slate-400 dark:text-slate-500'>{moment(message.createdAt).fromNow()}</p>
                            </div>
                            <div className='flex justify-between'>
                                <p className='text-gray-500 dark:text-slate-400 flex items-center gap-1'>
                                    {Icon && <Icon className='size-3' />}
                                    {label}
                                </p>
                                { !message.seen && <p className='bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>}
                            </div>
                        </div>
                    </Link>
                    );
                })
            }
        </div>
    </div>
  )
}

export default RecentMessages