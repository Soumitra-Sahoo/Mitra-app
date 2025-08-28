import React, { useState } from 'react'
import { dummyConnectionsData } from '../assets/assets'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading' // Add this line

const Discover = () => {

  const [input, setInput] = useState('')
  const [users, setUsers] = useState(dummyConnectionsData)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    if(e.key === 'Enter'){
      setUsers([])
      setLoading(true)
      setTimeout(()=>{
        setUsers(dummyConnectionsData)
        setLoading(false)
      }, 1000)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>
             {/* Title */}
        <div className='mb-8'>
        <h1 className='text-3xl font-bold text-slate-900 mb-2'>Discover People</h1>
          <p className='text-slate-600'>Connect with people..</p>
            </div>

         {/* Search */}
         <div className='mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80'>
            <div className='p-6'>
                <div className='relative'>
                  <Search className=' absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-5'/>
                  <input type="text" onChange={(e)=>setInput(e.target.value)} value={input} onKeyUp={handleSearch} className='pl-10 sm:pl-12 w-full py-2 border border-gray-300 rounded-md max-sm:text-sm' placeholder='Search people by name, username, bio or location...' />
                </div>
            </div>
         </div>
         <div className='flex flex-wrap gap-6'>
          { users.map((user) => (
            <UserCard key={user._id} user={user}/>
          ))}
          {
          loading && (<Loading height='60vh'/>)
        }
        </div>
      </div>
      
    </div>
  )
}

export default Discover
