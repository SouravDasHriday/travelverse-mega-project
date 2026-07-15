import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  Adventure: 'bg-orange-500/20 text-orange-300',
  Beach: 'bg-cyan-500/20 text-cyan-300',
  City: 'bg-purple-500/20 text-purple-300',
  Culture: 'bg-yellow-500/20 text-yellow-300',
  Food: 'bg-red-500/20 text-red-300',
  Nature: 'bg-emerald-500/20 text-emerald-300',
  Backpacking: 'bg-blue-500/20 text-blue-300',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop';

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const isOwner = user && (user._id === post.author?._id || user.role === 'admin');

  return (
    <div className="glass-card overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/20 flex flex-col">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={post.image || DEFAULT_IMAGE}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <span className={`absolute top-3 left-3 tag ${CATEGORY_COLORS[post.category] || 'bg-slate-500/20 text-slate-300'}`}>
          {post.category}
        </span>
        <span className="absolute top-3 right-3 tag bg-black/40 text-white backdrop-blur-sm">
          ❤️ {post.likes?.length || 0}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>📍</span>
          <span>{post.location}, {post.country}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-3 flex-1">
          {post.description}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
              {post.author?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-slate-400">{post.author?.username}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/post/${post._id}`}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Read →
            </Link>
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(post._id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
