import { useEffect, useState } from 'react';
import { getAllUsers, getAllPosts, deleteUser, deletePost } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, posts: 0 });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([getAllUsers(), getAllPosts()]);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
      setStats({ users: usersRes.data.length, posts: postsRes.data.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user and all their posts?')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u._id !== id));
    } catch {
      alert('Failed to delete user');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p._id !== id));
    } catch {
      alert('Failed to delete post');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-1">Manage users, posts, and site content</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: '👥', color: 'emerald' },
            { label: 'Total Posts', value: stats.posts, icon: '📝', color: 'blue' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: '🛡️', color: 'purple' },
            { label: 'Regular Users', value: users.filter(u => u.role === 'user').length, icon: '🧭', color: 'orange' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card p-5">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-3xl font-bold text-white">{loading ? '...' : value}</p>
              <p className="text-slate-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'posts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab} ({tab === 'users' ? stats.users : stats.posts})
            </button>
          ))}
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">User</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Email</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Role</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Joined</th>
                    <th className="text-right text-slate-400 font-semibold px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading...</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                            {u.username[0].toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`tag ${u.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u._id !== user._id && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Table */}
        {activeTab === 'posts' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Title</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Author</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Category</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Likes</th>
                    <th className="text-left text-slate-400 font-semibold px-6 py-4">Date</th>
                    <th className="text-right text-slate-400 font-semibold px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading...</td></tr>
                  ) : posts.map((p) => (
                    <tr key={p._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium max-w-xs truncate">{p.title}</td>
                      <td className="px-6 py-4 text-slate-400">{p.author?.username || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-400">{p.category}</td>
                      <td className="px-6 py-4 text-slate-400">❤️ {p.likes?.length || 0}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeletePost(p._id)}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
