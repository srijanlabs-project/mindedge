import React, { useState } from "react";
import { BlogArticle, UserProfile } from "../types";
import { 
  BookOpen, Search, Filter, Plus, Clock, User, Heart, Star, 
  Send, Sparkles, AlertCircle, ArrowUpRight 
} from "lucide-react";

interface BlogSectionProps {
  articles: BlogArticle[];
  userProfile: UserProfile | null;
  onAddArticle: (articleData: any) => Promise<void>;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  articles,
  userProfile,
  onAddArticle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New post form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<any>("competition_anxiety");
  const [image, setImage] = useState("");

  const categories = [
    { id: "competition_anxiety", label: "Competition Anxiety" },
    { id: "focus_concentration", label: "Focus & Concentration" },
    { id: "parent_guidance", label: "Parent Guidance" },
    { id: "mental_fitness", label: "Mental Fitness" },
    { id: "athlete_development", label: "Athlete Development" }
  ];

  // Filters blogs
  const filteredArticles = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === "" || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const featuredArticles = articles.filter((a) => a.featured);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      const defaultImg = "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80";
      await onAddArticle({
        title,
        content,
        category,
        image: image || defaultImg,
        featured: false
      });
      setShowAddArticle(false);
      setTitle("");
      setContent("");
      setImage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if therapist to show publish trigger
  const canPublish = userProfile && (userProfile.role === "therapist" || userProfile.role === "admin");

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-sans text-gray-800">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/5 to-transparent rounded-3xl p-6 md:p-8 border border-violet-100/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            Athlete Mental Library
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">Athlete Mindset & Parent Guidance Resources</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Discover peer-reviewed clinical articles published by approved sports psychologists on pre-match anxiety, attention training, and parenting.
          </p>
        </div>
        
        {canPublish && (
          <button
            onClick={() => setShowAddArticle(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all shrink-0 font-sans"
          >
            <Plus className="w-4 h-4" />
            Publish Mindset Article
          </button>
        )}
      </div>

      {/* SEARCH AND CATEGORY FILTERS ACCORDION */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between select-none font-sans">
        
        {/* Category buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              activeCategory === "" 
                ? "bg-violet-600 border-violet-600 text-white" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
            }`}
          >
            All Resources
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-violet-600 border-violet-600 text-white" 
                  : "bg-white text-gray-600 border-gray-200/50 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Local search input */}
        <div className="relative w-full md:w-80 font-sans">
          <Search className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources contents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* MAIN ARTICLES GRID */}
      {filteredArticles.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 p-6">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="text-md font-bold text-gray-900 mt-4 font-sans">No matching articles in library</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
            Verify content searches or select "All Resources" to consult other registered youth athletic development articles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {filteredArticles.map((art, idx) => (
            <div 
              key={art.id || `blog-${idx}`} 
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {art.image && (
                <img 
                  src={art.image} 
                  alt={art.title} 
                  className="h-44 w-full object-cover border-b border-gray-50 select-none"
                  onError={(e) => {
                    // Fallback
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              )}

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-violet-100/60 text-violet-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                    {categories.find(c => c.id === art.category)?.label || "Wellness Guidance"}
                  </span>
                  <h3 className="text-md font-extrabold text-gray-900 tracking-tight leading-tight line-clamp-2 hover:text-indigo-700 cursor-pointer">{art.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans line-clamp-4 pr-1">{art.content}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span className="font-bold text-violet-600">✍️ Author: {art.authorName}</span>
                  <span>📅 {new Date(art.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* PUBLISH ARTICLE MODAL */}
      {showAddArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150 max-h-[90vh] overflow-y-auto text-gray-800 font-sans">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" />
              Publish Athlete Guidance Article
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Write professional guidelines to support team anxiety, sideline coaching pressures, or athlete focus training drills.
            </p>

            <form onSubmit={handlePostSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Article Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Article Title</label>
                <input
                  type="text"
                  placeholder="e.g. Overcoming Penalty-Shootout Stress in Football"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Banner Image link (Optional Unsplash URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Clinical Content guidelines</label>
                <textarea
                  rows={6}
                  placeholder="Provide detailed, action-oriented therapeutic suggestions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAddArticle(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {submitting ? "Publishing to library..." : "Publish Article Now"}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
