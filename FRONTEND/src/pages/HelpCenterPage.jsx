import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import helpCenterApi from "../api/helpCenterApi";

// ── Category icon map ─────────────────────────────────────────────────────────
function CategoryIcon({ iconKey, color = "#6b7280" }) {
  const icons = {
    user: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bookmark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    star: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    report: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    navigate: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <polygon points="3 11 22 2 13 21 11 13 3 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    bexxa: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" fill={color}/>
      </svg>
    ),
  };
  return icons[iconKey] || icons.report;
}

// icon bg colours per category
const CAT_COLORS = {
  "account-login":   { bg: "#eff6ff", color: "#3b82f6" },
  "saved-stations":  { bg: "#fef3c7", color: "#f59e0b" },
  "reviews":         { bg: "#fdf4ff", color: "#a855f7" },
  "reports":         { bg: "#fff7ed", color: "#f97316" },
  "navigation":      { bg: "#f0fdf4", color: "#16a34a" },
  "bexxa-assistant": { bg: "#fdf4ff", color: "#ec4899" },
};
const catStyle = (slug) => CAT_COLORS[slug] || { bg: "#f3f4f6", color: "#6b7280" };

// ── FAQ Accordion item ────────────────────────────────────────────────────────
function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ border: "1px solid #e5e7eb", background: "#fff" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold pr-4" style={{ color: "#111827" }}>{faq.title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "#9ca3af" }}
        >
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid #f3f4f6" }}>
          <p className="text-sm leading-relaxed pt-3" style={{ color: "#4b5563" }}>{faq.content}</p>
        </div>
      )}
    </div>
  );
}

// ── Search results list ───────────────────────────────────────────────────────
function SearchResults({ results, loading, query, onArticleClick }) {
  if (loading) return (
    <div className="mt-4 space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
          <div className="h-3 rounded mb-2" style={{ background: "#f3f4f6", width: "60%" }}/>
          <div className="h-3 rounded" style={{ background: "#f3f4f6", width: "40%" }}/>
        </div>
      ))}
    </div>
  );

  if (!query.trim()) return null;

  if (results.length === 0) return (
    <div className="mt-4 rounded-xl p-6 text-center" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
      <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>No results for "{query}"</p>
      <p className="text-xs" style={{ color: "#9ca3af" }}>Try different keywords or browse by category below.</p>
    </div>
  );

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs mb-2" style={{ color: "#6b7280" }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
      {results.map(a => {
        const cs = catStyle(a.category);
        return (
          <button key={a.slug} onClick={() => onArticleClick(a)}
            className="w-full text-left rounded-xl p-4 transition-colors"
            style={{ background: "#fff", border: "1px solid #e5e7eb" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#c8d5c8"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <div className="flex items-start gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: cs.bg, color: cs.color }}>
                {a.category.replace(/-/g, " ")}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>{a.title}</p>
                {a.summary && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{a.summary}</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Article modal ─────────────────────────────────────────────────────────────
function ArticleModal({ slug, onClose }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    helpCenterApi.getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const cs = article ? catStyle(article.category) : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#fff", maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Help Article</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 rounded" style={{ background: "#f3f4f6", width: "70%" }}/>
              <div className="h-3 rounded" style={{ background: "#f3f4f6", width: "40%" }}/>
              <div className="h-3 rounded" style={{ background: "#f3f4f6" }}/>
              <div className="h-3 rounded" style={{ background: "#f3f4f6", width: "90%" }}/>
            </div>
          ) : article ? (
            <>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: cs.bg, color: cs.color }}>
                {article.category.replace(/-/g, " ")}
              </span>
              <h3 className="text-base font-bold mt-3 mb-2" style={{ color: "#111827" }}>{article.title}</h3>
              {article.summary && (
                <p className="text-sm mb-3" style={{ color: "#6b7280" }}>{article.summary}</p>
              )}
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{article.content}</p>

              {article.related?.length > 0 && (
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>RELATED ARTICLES</p>
                  <div className="space-y-1.5">
                    {article.related.map(r => (
                      <button key={r.slug} onClick={() => {
                        setLoading(true);
                        helpCenterApi.getArticleBySlug(r.slug).then(setArticle).finally(() => setLoading(false));
                      }}
                        className="block text-sm text-left w-full transition-colors hover:underline"
                        style={{ color: "#16a34a" }}>
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "#6b7280" }}>Article not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Live Chat modal ───────────────────────────────────────────────────────────
function LiveChatModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center"
        style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#f0fdf4" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: "#111827" }}>Live Chat Coming Soon</h3>
        <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
          Live chat is not yet available. In the meantime, send us a message via the Contact page and we'll get back to you quickly.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => { onClose(); navigate("/contact"); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
            Go to Contact Page
          </button>
          <button onClick={onClose}
            className="text-xs mt-1" style={{ color: "#9ca3af" }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pageData, setPageData]         = useState(null);
  const [loading, setLoading]           = useState(true);

  // search
  const [searchQuery, setSearchQuery]   = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef(null);

  // active category filter
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");

  // category articles
  const [catArticles, setCatArticles]   = useState([]);
  const [catLoading, setCatLoading]     = useState(false);

  // open FAQ index
  const [openFaq, setOpenFaq]           = useState(null);

  // modals
  const [articleSlug, setArticleSlug]   = useState(null);
  const [showChat, setShowChat]         = useState(false);

  // load page data
  useEffect(() => {
    helpCenterApi.getPageData()
      .then(setPageData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await helpCenterApi.getArticles({ search: searchQuery, limit: 10 });
        setSearchResults(data.articles);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  // load category articles
  useEffect(() => {
    if (!activeCategory) { setCatArticles([]); return; }
    setCatLoading(true);
    helpCenterApi.getArticles({ category: activeCategory, limit: 20 })
      .then(d => setCatArticles(d.articles))
      .catch(() => setCatArticles([]))
      .finally(() => setCatLoading(false));
  }, [activeCategory]);

  const handleCategoryClick = (slug) => {
    const next = activeCategory === slug ? "" : slug;
    setActiveCategory(next);
    setSearchQuery("");
    setSearchResults([]);
    setSearchParams(next ? { category: next } : {});
    // scroll to category section
    document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleArticleClick = (article) => {
    setArticleSlug(article.slug);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "#e5e7eb", borderTopColor: "#16a34a" }}/>
    </div>
  );

  const { hero, categories = [], faqs = [], cta } = pageData || {};

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb" }}>

      {/* ── Hero ── */}
      <section className="py-14 px-4 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2.5"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="12" cy="17" r="1" fill="#16a34a"/>
          </svg>
          {hero?.badge || "Support Center"}
        </span>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#111827" }}>{hero?.title || "Help Center"}</h1>
        <p className="text-base mb-8" style={{ color: "#6b7280" }}>{hero?.subtitle}</p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text" value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveCategory(""); setSearchParams(e.target.value ? { q: e.target.value } : {}); }}
            placeholder="Search help articles..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none shadow-sm"
            style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#111827" }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchParams({}); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Search results */}
        <div className="max-w-lg mx-auto">
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            query={searchQuery}
            onArticleClick={handleArticleClick}
          />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ── Browse by Category ── */}
        <section id="categories-section">
          <h2 className="text-xl font-extrabold mb-1" style={{ color: "#111827" }}>Browse by Category</h2>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Choose a topic to find relevant help articles</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const cs = catStyle(cat.slug);
              const isActive = activeCategory === cat.slug;
              return (
                <button key={cat.slug} onClick={() => handleCategoryClick(cat.slug)}
                  className="text-left rounded-xl p-5 flex items-center gap-4 transition-all"
                  style={{
                    background: isActive ? cs.bg : "#fff",
                    border: `1px solid ${isActive ? cs.color : "#e5e7eb"}`,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = "#c8d5c8"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cs.bg }}>
                    <CategoryIcon iconKey={cat.iconKey} color={cs.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{cat.name}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "#6b7280" }}>{cat.description}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"
                    style={{ color: isActive ? cs.color : "#d1d5db" }}>
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Category articles panel */}
          {activeCategory && (
            <div className="mt-6 rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb", background: "#fff" }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
                <p className="text-sm font-bold" style={{ color: "#111827" }}>
                  {categories.find(c => c.slug === activeCategory)?.name}
                </p>
                <button onClick={() => { setActiveCategory(""); setSearchParams({}); }}
                  className="text-xs" style={{ color: "#9ca3af" }}>
                  Clear
                </button>
              </div>
              {catLoading ? (
                <div className="p-5 space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "#f3f4f6" }}/>
                  ))}
                </div>
              ) : catArticles.length === 0 ? (
                <p className="p-5 text-sm" style={{ color: "#9ca3af" }}>No articles in this category yet.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                  {catArticles.map(a => (
                    <button key={a.slug} onClick={() => handleArticleClick(a)}
                      className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#111827" }}>{a.title}</p>
                        {a.summary && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{a.summary}</p>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ color: "#d1d5db" }}>
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── FAQ ── */}
        <section className="mt-14">
          <h2 className="text-xl font-extrabold mb-1" style={{ color: "#111827" }}>Frequently Asked Questions</h2>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Quick answers to common questions</p>

          <div className="max-w-2xl space-y-2">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={faq.slug}
                faq={faq}
                isOpen={openFaq === idx}
                onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
              />
            ))}
          </div>
        </section>

        {/* ── Support CTA ── */}
        <section className="mt-14">
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth="2"/>
                <polyline points="22,6 12,13 2,6" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">{cta?.title || "Still need help?"}</h2>
            <p className="text-sm mb-7 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
              {cta?.text || "Can't find what you're looking for? Our support team is ready to assist you."}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => navigate("/contact")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#fff", color: "#16a34a" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#16a34a" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="#16a34a" strokeWidth="2"/>
                </svg>
                Contact Support
              </button>
              <button onClick={() => setShowChat(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Live Chat
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Article modal ── */}
      {articleSlug && <ArticleModal slug={articleSlug} onClose={() => setArticleSlug(null)} />}

      {/* ── Live chat modal ── */}
      {showChat && <LiveChatModal onClose={() => setShowChat(false)} />}
    </div>
  );
}
