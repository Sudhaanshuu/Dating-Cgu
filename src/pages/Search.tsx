import React, { useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { toast } from 'react-toastify';
import { Search as SearchIcon, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Search Users</h1>
        
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or username..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <SearchIcon className="w-5 h-5 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((profile) => (
              <Link
                key={profile.id}
                to={`/user/${profile.username}`}
                className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{profile.full_name || profile.username}</h3>
                    <p className="text-gray-400">@{profile.username}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm && !loading ? (
              <p className="text-gray-400">No users found matching "{searchTerm}"</p>
            ) : (
              <div className="flex flex-col items-center">
                <SearchIcon className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-gray-400">Search for users by name or username</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;