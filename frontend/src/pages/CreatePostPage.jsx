import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/api';

const CATEGORIES = ['Adventure', 'Beach', 'City', 'Culture', 'Food', 'Nature', 'Backpacking'];

export default function CreatePostPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    category: 'Adventure',
    image: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createPost(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">Share Your Story</h1>
          <p className="text-slate-400 mt-2">Tell the world about your travel experience</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Image Preview */}
          {form.image && (
            <div className="mb-5 rounded-xl overflow-hidden h-48">
              <img
                src={form.image}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Post Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="My epic adventure in the Himalayas..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Location / City *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Kathmandu"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Country *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Nepal"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cover Image URL (optional)</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://example.com/photo.jpg"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              <p className="text-xs text-slate-600 mt-1">Paste a direct link to an image (from Unsplash, Pexels, etc.)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Story *</label>
              <textarea
                className="input-field resize-none"
                rows={8}
                placeholder="Describe your experience, what you saw, felt, and discovered..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : '🌍 Publish Story'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
