import React, { useState } from 'react';
import { uploadProfileImage } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Upload, User } from 'lucide-react';

interface ProfileImageUploadProps {
  currentAvatarUrl: string | null;
  onUploadSuccess: (url: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ 
  currentAvatarUrl, 
  onUploadSuccess 
}) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) {
      return;
    }
    
    const file = event.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    setUploading(true);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to upload an image');
      }
      
      const { publicUrl } = await uploadProfileImage(file, user.id);
      toast.success('Profile image updated successfully');
      onUploadSuccess(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="relative w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-900 overflow-hidden group">
      {currentAvatarUrl ? (
        <img 
          src={currentAvatarUrl} 
          alt="Profile" 
          className="w-full h-full object-cover" 
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none';
        (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');

          }}
        />
      ) : null}
      
      <div className={`w-full h-full flex items-center justify-center ${currentAvatarUrl ? 'hidden' : ''}`}>
        <User className="w-16 h-16 text-purple-400" />
      </div>
      
      <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center cursor-pointer transition-all duration-200">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
          <Upload className="w-8 h-8 text-white" />
          <span className="text-xs text-white mt-1">Upload</span>
        </div>
        <input
          type="file"
          className="sr-only"
          accept="image/*"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>
      
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;