import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Message } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Send } from 'lucide-react';

const Messages: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      try {
        // Get all users the current user has exchanged messages with
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Extract unique user IDs (excluding current user)
          const userIds = [...new Set(
            data.flatMap(msg => [msg.sender_id, msg.receiver_id])
          )].filter(id => id !== user.id);
          
          if (userIds.length > 0) {
            // Fetch profiles for these users
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);
              
            if (profilesError) throw profilesError;
            setConversations(profiles || []);
          }
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !username) return;
    
    const fetchActiveProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) throw error;
        
        if (data) {
          setActiveProfile(data);
          fetchMessages(data.id);
        }
      } catch (error: any) {
        toast.error(error.message);
        navigate('/messages');
      }
    };

    fetchActiveProfile();
  }, [user, username, navigate]);

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data
          .filter(msg => msg.receiver_id === user.id && !msg.read)
          .map(msg => msg.id);
          
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeProfile || !newMessage.trim()) return;
    
    setSendingMessage(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeProfile.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
      
      // Refresh messages
      fetchMessages(activeProfile.id);
      
      // Add this user to conversations if not already there
      if (!conversations.some(p => p.id === activeProfile.id)) {
        setConversations([activeProfile, ...conversations]);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Not logged in</h2>
        <p className="text-gray-400 mb-6">Please log in to view your messages</p>
        <Link
          to="/login"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
      
      <div className="flex-1 flex bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        {/* Conversations list */}
        <div className="w-64 border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-medium text-white">Conversations</h2>
          </div>
          
          {loading ? (
            <div className="p-4 text-center">
              <div className="text-purple-400">Loading...</div>
            </div>
          ) : conversations.length > 0 ? (
            <div>
              {conversations.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/messages/${profile.username}`}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors ${
                    activeProfile?.id === profile.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-medium text-white truncate">
                      {profile.full_name || profile.username}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">@{profile.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-400">No conversations yet</p>
              <Link
                to="/search"
                className="mt-2 inline-block text-sm text-purple-400 hover:text-purple-300"
              >
                Find people to message
              </Link>
            </div>
          )}
        </div>
        
        {/* Message area */}
        <div className="flex-1 flex flex-col">
          {activeProfile ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {activeProfile.full_name || activeProfile.username}
                  </h3>
                  <p className="text-sm text-gray-400">@{activeProfile.username}</p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-purple-600 text-white self-end rounded-br-none'
                          : 'bg-gray-800 text-white self-start rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user.id ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400">No messages yet. Say hello!</p>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-xl font-medium text-white mb-2">Select a conversation</h3>
                <p className="text-gray-400">
                  Choose a conversation from the list or{' '}
                  <Link to="/search" className="text-purple-400 hover:text-purple-300">
                    search for someone
                  </Link>{' '}
                  to message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;