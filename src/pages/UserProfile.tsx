import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, UserPlus, UserMinus, MessageSquare } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      try {
        // Get profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
          
          // Check if current user is following this profile
          if (user) {
            const { data: followData, error: followError } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', data.id)
              .single();

            if (!followError) {
              setIsFollowing(!!followData);
            }
          }

          // Get follower count
          const { count: followers, error: followerError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', data.id);

          if (followerError) throw followerError;
          setFollowerCount(followers || 0);

          // Get following count
          const { count: following, error: followingError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', data.id);

          if (followingError) throw followingError;
          setFollowingCount(following || 0);
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);

        if (error) throw error;
        
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast.success(`Unfollowed @${profile.username}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });

        if (error) throw error;
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success(`Following @${profile.username}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const startConversation = () => {
    if (!profile) return;
    navigate(`/messages/${profile.username}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-purple-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">User not found</h2>
        <p className="text-gray-400">The user you're looking for doesn't exist</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-purple-600 to-blue-600"></div>
        
        <div className="p-6 -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-900 flex items-center justify-center overflow-hidden">
              <User className="w-16 h-16 text-purple-400" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{profile.full_name || profile.username}</h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
            
            <div className="flex gap-4 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{followerCount}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{followingCount}</div>
                <div className="text-sm text-gray-400">Following</div>
              </div>
            </div>
          </div>
          
          {user && user.id !== profile.id && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center ${
                  isFollowing 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500' 
                    : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Follow
                  </>
                )}
              </button>
              
              <button
                onClick={startConversation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;