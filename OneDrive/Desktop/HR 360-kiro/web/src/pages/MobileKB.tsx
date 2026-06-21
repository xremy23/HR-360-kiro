import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Plus } from 'lucide-react';
import apiService from '../services/apiService';
import KBCreationForm, { KBFormData } from '../components/KBCreationForm';

interface GuideSections {
  before: string[];
  during: string[];
  after: string[];
}

interface GuideItem {
  id: string;
  category: 'disaster' | 'hr' | 'work' | string;
  subcategory: string;
  title: string;
  description?: string;
  content?: string;
  sections?: GuideSections;
  updatedAt: string;
  isCached?: boolean;
  createdAt?: string;
  isPublished?: boolean;
}

const MobileKB: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessMode } = useSelector((state: RootState) => state.auth);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [guideSearch, setGuideSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'disaster' | 'hr' | 'work' | string>('all');
  const [isCreationFormOpen, setIsCreationFormOpen] = useState(false);
  const [customGuides, setCustomGuides] = useState<GuideItem[]>([]);
  const [apiGuides, setApiGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Only admins can create KB - DISABLED FOR MOBILE VIEW (KB creation only in admin console)
  const canCreateKB = false;

  // Load guides from backend API on mount
  useEffect(() => {
    const loadGuides = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/kb/guides', { isPublished: true });
        if (response.success && response.data) {
          const guides = Array.isArray(response.data) ? response.data : [];
          // Convert backend format to frontend format
          const convertedGuides: GuideItem[] = guides.map((guide: any) => ({
            id: guide.id,
            category: guide.categoryId || guide.category || 'general',
            subcategory: guide.categoryId || guide.category || 'General',
            title: guide.title,
            description: guide.content?.substring(0, 100) || guide.description,
            content: guide.content,
            updatedAt: guide.updatedAt || guide.createdAt || new Date().toISOString(),
            isCached: false,
            createdAt: guide.createdAt,
            isPublished: guide.isPublished,
          }));
          setApiGuides(convertedGuides);
          console.log('Loaded guides from API:', convertedGuides);
        }
      } catch (error) {
        console.warn('Failed to fetch guides from API, using offline guides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGuides();
  }, []);

  // Filter and search algorithm
  const allGuidesForFiltering = [...apiGuides, ...customGuides];
  
  const filteredGuides = useMemo(() => {
    return allGuidesForFiltering.filter((g) => {
      const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
      const cleanSearch = guideSearch.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        g.title.toLowerCase().includes(cleanSearch) ||
        g.subcategory.toLowerCase().includes(cleanSearch) ||
        (g.description && g.description.toLowerCase().includes(cleanSearch)) ||
        (g.sections && (
          g.sections.before.some((step) => step.toLowerCase().includes(cleanSearch)) ||
          g.sections.during.some((step) => step.toLowerCase().includes(cleanSearch)) ||
          g.sections.after.some((step) => step.toLowerCase().includes(cleanSearch))
        ));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, guideSearch, apiGuides, customGuides]);

  const handleCategoryChange = (category: 'all' | 'disaster' | 'hr' | 'work') => {
    setSelectedCategory(category);
    setSelectedGuide(null);
  };

  // Get unique categories for dropdown
  const uniqueCategories = Array.from(
    new Set([...apiGuides, ...customGuides].map((g) => g.category as string))
  );

  const handleCreateGuide = (formData: KBFormData) => {
    const newGuide: GuideItem = {
      id: `kb-${Date.now()}`,
      category: formData.category,
      subcategory: formData.category,
      title: formData.title,
      description: formData.title,
      sections: {
        before: formData.before.split('\n').filter((s) => s.trim()),
        during: formData.during.split('\n').filter((s) => s.trim()),
        after: formData.after.split('\n').filter((s) => s.trim()),
      },
      updatedAt: new Date().toISOString().split('T')[0],
      isCached: true,
    };

    setCustomGuides([...customGuides, newGuide]);
    setIsCreationFormOpen(false);
  };

  // DETAIL VIEW: Expanded guide display
  if (selectedGuide) {
    return (
      <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-40 px-4 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#038F8D]/10 text-[#038F8D] dark:text-[#49D7D1]">
                  {selectedGuide.category}
                </span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  Offline Synced
                </span>
              </div>
              <h2 className="font-extrabold text-sm text-[#038F8D] dark:text-[#49D7D1] leading-snug">
                {selectedGuide.subcategory}
              </h2>
            </div>
            <button
              onClick={() => setSelectedGuide(null)}
              className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-stone-500 dark:text-stone-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 pb-24 space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-neutral-850 dark:text-stone-100">
              {selectedGuide.title}
            </h3>
            <p className="text-[11px] text-stone-700 dark:text-neutral-400 leading-normal">
              {selectedGuide.description}
            </p>
          </div>

          {/* Three-Stage Chronological Response Roadmap */}
          <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-neutral-800">
            {/* Display sections if available, otherwise display content */}
            {selectedGuide.sections ? (
              <>
                {/* BEFORE */}
                <div className="border-l-4 border-[#038F8D] pl-3 space-y-2">
                  <h4 className="font-black text-[10px] text-[#038F8D] dark:text-[#49D7D1] tracking-wider uppercase flex items-center gap-1">
                    🛡️ 1. BEFORE (Preparedness Tasks)
                  </h4>
                  <ul className="list-inside list-disc text-[11px] text-stone-700 dark:text-neutral-300 space-y-1 leading-snug pl-2">
                    {selectedGuide.sections.before.map((step, idx) => (
                      <li key={idx} className="marker:text-[#038F8D]">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DURING */}
                <div className="border-l-4 border-red-500 pl-3 space-y-2">
                  <h4 className="font-black text-[10px] text-red-500 dark:text-red-400 tracking-wider uppercase flex items-center gap-1">
                    🚨 2. DURING (Immediate Response)
                  </h4>
                  <ul className="list-inside list-disc text-[11px] text-stone-700 dark:text-neutral-300 space-y-1 leading-snug pl-2">
                    {selectedGuide.sections.during.map((step, idx) => (
                      <li key={idx} className="marker:text-red-500">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AFTER */}
                <div className="border-l-4 border-amber-500 pl-3 space-y-2">
                  <h4 className="font-black text-[10px] text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1">
                    ✅ 3. AFTER (Recovery Protocols)
                  </h4>
                  <ul className="list-inside list-disc text-[11px] text-stone-700 dark:text-neutral-300 space-y-1 leading-snug pl-2">
                    {selectedGuide.sections.after.map((step, idx) => (
                      <li key={idx} className="marker:text-amber-600">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              // Display content as markdown-like text
              <div className="prose prose-sm dark:prose-invert max-w-none text-[11px] text-stone-700 dark:text-neutral-300 whitespace-pre-wrap">
                {selectedGuide.content}
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="text-[9px] text-stone-400 dark:text-neutral-500 text-right pt-2 border-t border-stone-100 dark:border-neutral-800/60 font-mono">
            Safety Code Audit: {selectedGuide.updatedAt}
          </div>
        </main>
      </div>
    );
  }

  // MAIN LIST VIEW: Directory and search interface
  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-40 px-4 py-4">
        <div className="pb-3 border-b border-stone-200 dark:border-neutral-850 flex justify-between items-center mb-3">
          <div>
            <h1 className="font-extrabold text-base text-[#038F8D] dark:text-[#49D7D1] tracking-tight">
              Preparedness Library
            </h1>
            <p className="text-[10px] text-stone-400 dark:text-neutral-500 font-medium">Safe Offline Defense Core</p>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold bg-[#038F8D]/10 dark:bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1] px-2.5 py-0.5 rounded-full">
            📘 {loading ? '...' : Math.max(0, filteredGuides.length)} Guides
          </span>
        </div>

        {/* Create Guide Button - Admin Only */}
        {canCreateKB && (
          <button
            onClick={() => setIsCreationFormOpen(true)}
            className="w-full py-2.5 rounded-xl bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus size={14} />
            <span>Create New Guide</span>
          </button>
        )}
      </header>

      {/* Offline Cache Status */}
      <div className="px-4 pt-3 pb-1">
        <div className={`p-2.5 border rounded-2xl flex items-center justify-between text-[10px] leading-none ${
          loading 
            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/15 dark:border-amber-500/10 text-amber-800 dark:text-amber-450'
            : apiGuides.length > 0
            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-450'
            : 'bg-stone-100/50 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-stone-400'
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            {loading ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Loading from server...</span>
              </>
            ) : apiGuides.length > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Server Database: {apiGuides.length} Guides</span>
              </>
            ) : (
              <>
                <span>📚 No guides available offline</span>
              </>
            )}
          </span>
          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${
            loading 
              ? 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : apiGuides.length > 0
              ? 'bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-stone-200 dark:bg-neutral-700 text-stone-600 dark:text-stone-400'
          }`}>
            {loading ? 'Loading' : apiGuides.length > 0 ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 relative">
        <span className="absolute left-6 top-5 text-stone-400 dark:text-neutral-500">🔍</span>
        <input
          type="text"
          placeholder="Search disasters, preparedness, safety..."
          value={guideSearch}
          onChange={(e) => setGuideSearch(e.target.value)}
          className="w-full text-xs p-2.5 pl-8 pr-8 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#038F8D] transition-all"
        />
        {guideSearch && (
          <button
            onClick={() => setGuideSearch('')}
            className="absolute right-5 top-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none sticky bg-stone-50/85 dark:bg-neutral-950/85 backdrop-blur-sm">
        {(['all', 'disaster', 'hr', 'work'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#038F8D] text-white shadow-sm'
                : 'bg-stone-200/60 text-stone-650 hover:bg-stone-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-850'
            }`}
          >
            {cat === 'all' && 'All Protocols'}
            {cat === 'disaster' && '🌋 Disaster'}
            {cat === 'hr' && '⚖️ HR Legal'}
            {cat === 'work' && '💻 Work Safe'}
          </button>
        ))}
      </div>

      {/* Guides List */}
      <main className="px-4 py-3 pb-24">
        <div className="space-y-2">
          {filteredGuides.length === 0 ? (
            <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-150 dark:border-neutral-850 text-center space-y-2">
              <p className="text-stone-400 dark:text-neutral-500 text-xs italic">
                No safety manuals found matching "{guideSearch}"
              </p>
              <p className="text-[10px] text-stone-350 dark:text-neutral-600">
                Try searching general terms like typhoon, flood, or earthquake
              </p>
            </div>
          ) : (
            filteredGuides.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGuide(g)}
                className="w-full p-3.5 bg-white dark:bg-neutral-900 border border-stone-150 dark:border-neutral-850 rounded-2xl cursor-pointer hover:border-[#038F8D] dark:hover:border-neutral-700 transition-all flex justify-between items-center group shadow-xs hover:shadow-md text-left"
              >
                <div className="flex-1 pr-2 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                      {g.category === 'disaster'
                        ? '🌋 Disaster'
                        : g.category === 'hr'
                        ? '⚖️ HR Legal'
                        : '💻 Work'}
                    </span>
                    <span className="text-[9px] font-semibold text-stone-400 dark:text-neutral-500">
                      {g.subcategory}
                    </span>
                    {g.isCached && (
                      <span className="text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded tracking-wider select-none font-mono">
                        Cached
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-xs text-neutral-800 dark:text-stone-100 group-hover:text-[#038F8D] dark:group-hover:text-[#49D7D1] transition-all">
                    {g.title}
                  </h3>
                  <p className="text-[10px] text-stone-400 dark:text-neutral-500 line-clamp-1">
                    {g.description}
                  </p>
                </div>
                <span className="text-stone-300 dark:text-neutral-700 group-hover:text-[#038F8D] dark:group-hover:text-[#49D7D1] group-hover:translate-x-0.5 transition-all shrink-0 text-lg">
                  →
                </span>
              </button>
            ))
          )}
        </div>
      </main>

      {/* KB Creation Form Modal */}
      <KBCreationForm
        isOpen={isCreationFormOpen}
        onClose={() => setIsCreationFormOpen(false)}
        onSubmit={handleCreateGuide}
        existingCategories={uniqueCategories}
        darkMode={false}
      />
    </div>
  );
};

export default MobileKB;
