import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { BlogArticle, UserProfile } from "../types";

interface BlogSectionProps {
  articles: BlogArticle[];
  userProfile: UserProfile | null;
  onAddArticle: (articleData: any) => Promise<void>;
}

const categories = [
  { id: "competition_anxiety", label: "Competition Anxiety" },
  { id: "focus_concentration", label: "Focus and Concentration" },
  { id: "parent_guidance", label: "Parent Guidance" },
  { id: "mental_fitness", label: "Mental Fitness" },
  { id: "athlete_development", label: "Athlete Development" },
] as const;

const isSampleArticle = (article: BlogArticle) =>
  article.title.toLowerCase().startsWith("sample:") || (article.authorId || "").startsWith("seed-");

const stripMarkdown = (content: string) =>
  content
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\*\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^---$/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const getArticleDescription = (content: string) => {
  const clean = stripMarkdown(content);
  return clean.length > 170 ? `${clean.slice(0, 167)}...` : clean;
};

const renderArticleBody = (content: string) => {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block === "---") {
      return <hr key={`hr-${index}`} className="border-slate-200 my-8" />;
    }

    if (block.startsWith("### ")) {
      return (
        <h3 key={`h3-${index}`} className="text-xl font-bold text-slate-900 mt-8">
          {block.replace(/^###\s+/, "")}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2 key={`h2-${index}`} className="text-2xl font-extrabold text-slate-900 mt-10">
          {block.replace(/^##\s+/, "")}
        </h2>
      );
    }

    if (block.startsWith("# ")) {
      return (
        <h1 key={`h1-${index}`} className="text-3xl font-black text-slate-900 mt-10">
          {block.replace(/^#\s+/, "")}
        </h1>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every((line) => line.startsWith("* "))) {
      return (
        <ul key={`ul-${index}`} className="space-y-2 pl-5 list-disc text-sm text-slate-600 leading-relaxed">
          {lines.map((line, lineIndex) => (
            <li key={`li-${index}-${lineIndex}`}>{line.replace(/^\*\s+/, "")}</li>
          ))}
        </ul>
      );
    }

    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <p key={`strong-${index}`} className="text-base font-bold text-indigo-700">
          {block.replace(/^\*\*/, "").replace(/\*\*$/, "")}
        </p>
      );
    }

    return (
      <p key={`p-${index}`} className="text-sm text-slate-600 leading-7 whitespace-pre-line">
        {block}
      </p>
    );
  });
};

export const BlogSection: React.FC<BlogSectionProps> = ({
  articles,
  userProfile,
  onAddArticle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<any>("competition_anxiety");
  const [image, setImage] = useState("");

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        const haystack = `${article.title} ${article.content}`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "" || article.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [activeCategory, articles, searchTerm],
  );

  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
    const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
    const twitterDescriptionMeta = document.querySelector('meta[name="twitter:description"]');

    const previousDescription = descriptionMeta?.getAttribute("content") || "";
    const previousOgTitle = ogTitleMeta?.getAttribute("content") || "";
    const previousOgDescription = ogDescriptionMeta?.getAttribute("content") || "";
    const previousTwitterTitle = twitterTitleMeta?.getAttribute("content") || "";
    const previousTwitterDescription = twitterDescriptionMeta?.getAttribute("content") || "";

    if (selectedArticle) {
      const description = getArticleDescription(selectedArticle.content);
      document.title = `${selectedArticle.title} | YovoEdge`;
      descriptionMeta?.setAttribute("content", description);
      ogTitleMeta?.setAttribute("content", `${selectedArticle.title} | YovoEdge`);
      ogDescriptionMeta?.setAttribute("content", description);
      twitterTitleMeta?.setAttribute("content", `${selectedArticle.title} | YovoEdge`);
      twitterDescriptionMeta?.setAttribute("content", description);
    } else {
      document.title = "YovoEdge | Think Sharp, Play Sharper";
      descriptionMeta?.setAttribute(
        "content",
        "YovoEdge is an online-first sports psychology platform for athletes, parents, schools, and licensed counselors.",
      );
      ogTitleMeta?.setAttribute("content", "YovoEdge | Think Sharp, Play Sharper");
      ogDescriptionMeta?.setAttribute(
        "content",
        "YovoEdge helps athletes, parents, schools, and counselors build confidence, focus, and resilience through online-first sports psychology support.",
      );
      twitterTitleMeta?.setAttribute("content", "YovoEdge | Think Sharp, Play Sharper");
      twitterDescriptionMeta?.setAttribute(
        "content",
        "YovoEdge helps athletes, parents, schools, and counselors build confidence, focus, and resilience through online-first sports psychology support.",
      );
    }

    return () => {
      document.title = previousTitle;
      descriptionMeta?.setAttribute("content", previousDescription);
      ogTitleMeta?.setAttribute("content", previousOgTitle);
      ogDescriptionMeta?.setAttribute("content", previousOgDescription);
      twitterTitleMeta?.setAttribute("content", previousTwitterTitle);
      twitterDescriptionMeta?.setAttribute("content", previousTwitterDescription);
    };
  }, [selectedArticle]);

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
        featured: false,
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

  const canPublish = userProfile && (userProfile.role === "therapist" || userProfile.role === "admin");

  if (selectedArticle) {
    const selectedCategory = categories.find((item) => item.id === selectedArticle.category)?.label || "Resource";

    return (
      <div className="space-y-8 animate-in fade-in duration-200 font-sans text-slate-800">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to library
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
            Blog Detail
          </span>
        </div>

        <article className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xs">
          {selectedArticle.image && (
            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full h-[280px] md:h-[420px] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          )}

          <div className="p-6 md:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-violet-100/70 text-violet-800 text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                {selectedCategory}
              </span>
              {isSampleArticle(selectedArticle) && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                  Sample
                </span>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                {selectedArticle.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="font-semibold text-violet-700">Author: {selectedArticle.authorName}</span>
                <span>{new Date(selectedArticle.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-5">{renderArticleBody(selectedArticle.content)}</div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-sans text-gray-800">
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/5 to-transparent rounded-3xl p-6 md:p-8 border border-violet-100/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
            YovoEdge Resource Library
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">
            Athlete mindset and parent guidance resources
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Explore YovoEdge articles on confidence, focus, pressure, and the missing mental layer of athlete development. Seeded entries are clearly marked as sample.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowAddArticle(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Publish article
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between select-none">
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
          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                activeCategory === item.id
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-white text-gray-600 border-gray-200/50 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
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

      {filteredArticles.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 p-6">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="text-md font-bold text-gray-900 mt-4">No matching articles in library</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Verify content searches or select "All Resources" to review the rest of the library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => (
            <article
              key={article.id || `blog-${index}`}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-44 w-full object-cover border-b border-gray-50 select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              )}

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-violet-100/60 text-violet-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                      {categories.find((item) => item.id === article.category)?.label || "Wellness Guidance"}
                    </span>
                    {isSampleArticle(article) && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                        Sample
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="text-left text-md font-extrabold text-gray-900 tracking-tight leading-tight hover:text-indigo-700 cursor-pointer"
                  >
                    {article.title}
                  </button>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {getArticleDescription(article.content)}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span className="font-bold text-violet-600">Author: {article.authorName}</span>
                  <span>{new Date(article.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(article)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 text-left"
                >
                  Read article
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAddArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in scale-in duration-150 max-h-[90vh] overflow-y-auto text-gray-800">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" />
              Publish YovoEdge Article
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Write practical guidance to support athlete confidence, focus, pressure management, or parent communication.
            </p>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Article Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
                  required
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Banner Image Link</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Article Content</label>
                <textarea
                  rows={6}
                  placeholder="Provide detailed, practical athlete or parent guidance..."
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
