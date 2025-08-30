import React, { useEffect, useState } from 'react'
import { dummyStoriesData } from '../assets/assets';
import { Plus } from 'lucide-react';
import moment from 'moment'
import StoryModel from './StoryModel';
import StoryViewer from './StoryViewer';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const StoriesBar = () => {

    const { getToken } = useAuth();

    const [stories, setStories] = useState([]);
    const [showModel, setShowModel] = useState(false);
    const [viewStory, setViewStory] = useState(false);

    const fetchStories = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/story/get', {
                headers: {Authorization: `Bearer ${token}`}
            })
            if(data.success){
                setStories(data.stories);
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(()=>{
        fetchStories();
    }, []);

  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4'>

        <div className='flex gap-4 pb-5'>
            {/* Add Story card */}
            <div onClick={()=>setShowModel(true)} className='rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50 to-white'>
                <div className='h-full flex flex-col items-center justify-center p-4'>
                    <div className='size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3'>
                        <Plus className='size-5 text-white'/>
                    </div>
                    <p className='text-sm font-medium text-slate-700 text-center'>Create Story</p>
                </div>
            </div>

            {/* Story Cards */}
            {
                stories.map((story, index) => (
                    <div key={index} onClick={() => setViewStory(story)} className={`relative rounded-lg shadow min-w-30 max-w-30 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95`}>
                        <img src={story.user.profile_picture} className='aspect-square object-cover absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow' alt="" />
                        <p className=' absolute top-18 left-3 text-white/60 text-sm truncate max-w-24'>{story.content}</p>
                        <p className='text-white absolute bottom-1 right-2 z-10 text-xs'>{moment(story.createdAt).fromNow()}</p>
                        {
                            story.media_type !== 'text' && (
                                <div className=' absolute inset-0 z-1 rounded-lg bg-black overflow-hidden'>
                                    {
                                        story.media_type === 'image' ? 
                                            <img src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80' alt="" /> 
                                        :
                                            <video src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80'/>
                                    }
                                </div>
                            )
                        }
                    </div>
                ))
            }
        </div>
        
        {/* Add Story Model */}
        {
            showModel && <StoryModel setShowModel={setShowModel} fetchStories={fetchStories}/>
        }

        {/* View Story Model */}
        {
            viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory}/>
        }
    </div>
  )
}

export default StoriesBar