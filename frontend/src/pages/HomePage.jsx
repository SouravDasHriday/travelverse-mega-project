import { useState, useEffect } from 'react';
import { getAllPosts, deletePost } from '../api/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Adventure', 'Beach', 'City', 'Culture', 'Food', 'Nature', 'Backpacking'];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&auto=format&fit=crop',
];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [heroIndex] = useState(Math.floor(Math.random() * HERO_IMAGES.length));
  const { user } = useAuth();

  const fetchPosts = async (category) => {
    try {
      setLoading(true);
      const res = await getAllPosts(category === 'All' ? null : category);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src={HERO_IMAGES[heroIndex]}
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-emerald-400 font-semibold tracking-widest text-sm uppercase mb-4">
            ✈️ Share Your World
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Every Journey<br />
            <span className="text-gradient">Tells a Story</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Discover inspiring travel stories, hidden gems, and breathtaking destinations from adventurers around the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <a href="/create-post" className="btn-primary text-base px-8 py-4">
                + Share Your Story
              </a>
            ) : (
              <>
                <a href="/register" className="btn-primary text-base px-8 py-4">Start Exploring Free</a>
                <a href="/login" className="btn-secondary text-base px-8 py-4">Sign In</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse">
                <div className="h-52 bg-white/5 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-5 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-xl font-display font-bold text-slate-400">No stories yet in this category</p>
            <p className="mt-2 text-sm">Be the first to share one!</p>
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
