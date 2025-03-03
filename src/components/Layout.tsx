import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, User, Users, MessageSquare } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-purple-400">CGU Connect</h1>
          <p className="text-gray-400 text-sm">Future of college connections</p>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <User className="mr-3 text-purple-400" size={20} />
                <span>Profile</span>
              </Link>
            </li>
            <li>
              <Link to="/search" className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Search className="mr-3 text-purple-400" size={20} />
                <span>Search</span>
              </Link>
            </li>
            <li>
              <Link to="/connections" className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Users className="mr-3 text-purple-400" size={20} />
                <span>Connections</span>
              </Link>
            </li>
            <li>
              <Link to="/messages" className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <MessageSquare className="mr-3 text-purple-400" size={20} />
                <span>Messages</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto">
          <button 
            onClick={handleSignOut}
            className="flex items-center p-2 w-full rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LogOut className="mr-3 text-purple-400" size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;