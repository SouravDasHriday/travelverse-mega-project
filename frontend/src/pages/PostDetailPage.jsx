import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, likePost, deletePost } from '../api/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop';

const CATEGORY_COLORS = {
  Adventure: 'bg-orange-500/20 text-orange-300',
  Beach: 'bg-cyan-500/20 text-cyan-300',
  City: 'bg-purple-500/20 text-purple-300',
  Culture: 'bg-yellow-500/20 text-yellow-300',
  Food: 'bg-red-500/20 text-red-300',
  Nature: 'bg-emerald-500/20 text-emerald-300',
  Backpacking: 'bg-blue-500/20 text-blue-300',
};

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPostById(id);
        setPost(res.data);
        setLikes(res.data.likes?.length || 0);
        if (user) {
          setLiked(res.data.likes?.includes(user._id));
        }
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await likePost(id);
      setLikes(res.data.likes);
      setLiked(!liked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id);
      navigate('/');
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-xl">Loading story...</div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = user && (user._id === post.author?._id || user.role === 'admin');
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Image */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src={post.image || DEFAULT_IMAGE}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <span className={`tag mb-3 inline-block ${CATEGORY_COLORS[post.category] || 'bg-slate-500/20 text-slate-300'}`}>
              {post.category}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
              {post.author?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{post.author?.username}</p>
              <p className="text-slate-500 text-sm">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>📍</span>
            <span>{post.location}, {post.country}</span>
          </div>
        </div>

        {/* Article Body */}
        <article className="prose prose-invert prose-lg max-w-none">
          <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
            {post.description}
          </p>
        </article>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/10">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              liked
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {liked ? '❤️' : '🤍'} {likes} {likes === 1 ? 'Like' : 'Likes'}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-sm py-2.5"
          >
            ← Back
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="ml-auto text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl transition-all"
            >
              🗑️ Delete Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
