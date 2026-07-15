import { useEffect, useState } from 'react';
import { getMyPosts, deletePost } from '../api/api';
import PostCard from '../components/PostCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const res = await getMyPosts();
        setPosts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPosts();
  }, []);

  const handleDelete = async (id) => {
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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">My Stories</h1>
            <p className="text-slate-400 mt-1">
              {posts.length} {posts.length === 1 ? 'story' : 'stories'} published by{' '}
              <span className="text-emerald-400">{user?.username}</span>
            </p>
          </div>
          <Link to="/create-post" className="btn-primary">
            + New Story
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse">
                <div className="h-52 bg-white/5 rounded-t-2xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">✍️</p>
            <p className="font-display text-2xl font-bold text-slate-400">No stories yet</p>
            <p className="text-slate-500 mt-2 mb-6">Share your first travel adventure with the world!</p>
            <Link to="/create-post" className="btn-primary inline-flex">
              Write Your First Story
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
