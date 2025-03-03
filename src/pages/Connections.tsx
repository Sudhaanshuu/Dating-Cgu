import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, UserMinus } from 'lucide-react';

const Connections: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchConnections = async () => {
      setLoading(true);
      
      try {
        if (activeTab === 'followers') {
          // Fetch followers
          const { data, error } = await supabase
            .from('follows')
            .select('profiles!follows_follower_id_fkey(*)')
            .eq('following_id', user.id);

          if (error) throw error;
          
          const followerProfiles = data
            .map(item => item.profiles as Profile)
            .filter(Boolean);
            
          setProfiles(followerProfiles);
        } else {
          // Fetch following
          const { data, error } = await supabase
            .from('follows')
            .select('profiles!follows_following_id_fkey(*)')
            .eq('follower_id', user.id);

          if (error) throw error;
          
          const followingProfiles = data
            .map(item => item.profiles as Profile)
            .filter(Boolean);
            
          setProfiles(followingProfiles);
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [user, activeTab]);

  const unfollowUser = async (profileId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);

      if (error) throw error;
      
      // Remove from list if on following tab
      if (activeTab === 'following') {
        setProfiles(profiles.filter(profile => profile.id !== profileId));
      }
      
      toast.success('Unfollowed successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Your Connections</h1>
        
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'followers'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('followers')}
          >
            Followers
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'following'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-purple-400">Loading...</div>
          </div>
        ) : profiles.length > 0 ? (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
              >
                <Link
                  to={`/user/${profile.username}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{profile.full_name || profile.username}</h3>
                    <p className="text-gray-400">@{profile.username}</p>
                  </div>
                </Link>
                
                {activeTab === 'following' && (
                  <button
                    onClick={() => unfollowUser(profile.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                    title="Unfollow"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {activeTab === 'followers'
                ? "You don't have any followers yet"
                : "You're not following anyone yet"}
            </p>
            {activeTab === 'following' && (
              <Link
                to="/search"
                className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Find people to follow
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;