import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const MobileKB: React.FC = () => {
  const navigate = useNavigate();
  const { guides } = useSelector((state: RootState) => state.kb);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  // Mock guides for demo
  const mockGuides = [
    {
      id: 1,
      title: 'Tornado Safety',
      category: 'Weather',
      description: 'What to do during a tornado warning',
      content: `
1. Go to the lowest floor of a sturdy building
2. Stay away from windows
3. Go to the center of the room
4. Cover yourself with a mattress or blankets
5. Stay there until the warning is lifted
      `,
      tags: ['weather', 'safety', 'tornado'],
    },
    {
      id: 2,
      title: 'Evacuation Procedures',
      category: 'Emergency',
      description: 'Step-by-step evacuation guide',
      content: `
1. Hear the alarm or announcement
2. Leave immediately - do not use elevators
3. Follow exit signs to the nearest exit
4. Move to the designated assembly point
5. Wait for further instructions
      `,
      tags: ['evacuation', 'emergency', 'procedures'],
    },
    {
      id: 3,
      title: 'First Aid Basics',
      category: 'Medical',
      description: 'Basic first aid techniques',
      content: `
1. Check for responsiveness
2. Call emergency services
3. Perform CPR if needed
4. Control bleeding with pressure
5. Keep the person warm and calm
      `,
      tags: ['medical', 'first-aid', 'health'],
    },
    {
      id: 4,
      title: 'Fire Safety',
      category: 'Safety',
      description: 'Fire prevention and response',
      content: `
1. Know all exits from your area
2. If you see fire, alert others
3. Use the nearest safe exit
4. Feel doors before opening
5. Stay low to avoid smoke
      `,
      tags: ['fire', 'safety', 'prevention'],
    },
  ];

  const allGuides = guides.length > 0 ? guides : mockGuides;

  const filteredGuides = allGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = Array.from(new Set(allGuides.map((g) => g.category)));

  const selectedGuideData = selectedGuide
    ? allGuides.find((g) => g.id.toString() === selectedGuide)
    : null;

  if (selectedGuideData) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setSelectedGuide(null)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-light hover:bg-opacity-20 transition text-primary-white"
            >
              ←
            </button>
            <div>
              <h1 className="font-display text-h3 text-primary-white">Guide</h1>
              <p className="font-sans text-body3 text-secondary-light">
                {selectedGuideData.category}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 pb-24">
          <h2 className="font-display text-display3 text-primary-black mb-4">
            {selectedGuideData.title}
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {selectedGuideData.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary-teal bg-opacity-10 text-primary-teal rounded-full font-sans text-caption font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="bg-primary-white rounded-xl p-6 shadow-md">
            <div className="font-sans text-body1 text-neutral-700 whitespace-pre-line leading-relaxed">
              {selectedGuideData.content}
            </div>
          </div>

          {/* Share Button */}
          <button className="w-full mt-6 bg-secondary-light text-primary-black font-sans font-semibold py-3 rounded-lg hover:bg-opacity-80 transition">
            📤 Share Guide
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-light hover:bg-opacity-20 transition text-primary-white"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-h3 text-primary-white">Knowledge Base</h1>
            <p className="font-sans text-body3 text-secondary-light">
              {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="font-sans text-label1 text-primary-black font-semibold mb-3">
            Categories
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full font-sans text-label2 font-semibold whitespace-nowrap bg-primary-white border-2 border-neutral-200 hover:border-primary-teal transition"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Guides List */}
        {filteredGuides.length > 0 ? (
          <div className="space-y-4">
            {filteredGuides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => setSelectedGuide(guide.id.toString())}
                className="w-full bg-primary-white rounded-xl shadow-md p-4 hover:shadow-lg transition text-left border-l-4 border-primary-teal"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-sans text-label1 text-primary-black font-semibold flex-1">
                    {guide.title}
                  </h3>
                  <span className="text-xl">→</span>
                </div>
                <p className="font-sans text-body2 text-neutral-600 mb-3">
                  {guide.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2 py-1 bg-primary-teal bg-opacity-10 text-primary-teal rounded font-sans text-caption font-semibold">
                    {guide.category}
                  </span>
                  <span className="font-sans text-body3 text-neutral-500">
                    {guide.tags?.length || 0} tags
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-sans text-h4 text-primary-black mb-2">No Guides Found</h3>
            <p className="font-sans text-body2 text-neutral-600">
              Try searching with different keywords
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MobileKB;
