import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, type Profile } from '../lib/supabase';
import { toast } from 'react-toastify';
import { User, Users } from 'lucide-react';
import ProfileImageUpload from './ProfileImageUpload';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
        }

        // Get follower count
        const { count: followers, error: followerError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        if (followerError) throw followerError;
        setFollowerCount(followers || 0);

        // Get following count
        const { count: following, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        if (followingError) throw followingError;
        setFollowingCount(following || 0);

      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully');
      
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleProfileImageUpdate = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: url,
        updated_at: new Date().toISOString(),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-purple-600 to-blue-600"></div>
        
        <div className="p-6 -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <ProfileImageUpload 
             currentAvatarUrl={profile?.avatar_url ?? null}
              onUploadSuccess={handleProfileImageUpdate} 
            />
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{profile?.full_name || profile?.username}</h1>
              <p className="text-gray-400">@{profile?.username}</p>
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
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Edit Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white opacity-70 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={updateProfile}
                disabled={updating}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;