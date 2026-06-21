import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface KBCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KBFormData) => void;
  existingCategories: string[];
  darkMode?: boolean;
}

export interface KBFormData {
  title: string;
  category: string;
  isNewCategory: boolean;
  newCategoryName?: string;
  before: string;
  during: string;
  after: string;
}

export function KBCreationForm({
  isOpen,
  onClose,
  onSubmit,
  existingCategories,
  darkMode = false,
}: KBCreationFormProps) {
  const [formData, setFormData] = useState<KBFormData>({
    title: '',
    category: existingCategories[0] || '',
    isNewCategory: false,
    before: '',
    during: '',
    after: '',
  });

  const [categories, setCategories] = useState(existingCategories);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    setCategories(existingCategories);
    if (existingCategories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        category: existingCategories[0],
      }));
    }
  }, [existingCategories]);

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setShowNewCategoryInput(true);
      setFormData((prev) => ({
        ...prev,
        isNewCategory: true,
        category: '',
      }));
    } else {
      setShowNewCategoryInput(false);
      setFormData((prev) => ({
        ...prev,
        isNewCategory: false,
        category: value,
      }));
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      setCategories([...categories, newCategoryName]);
      setFormData((prev) => ({
        ...prev,
        category: newCategoryName,
        isNewCategory: true,
        newCategoryName: newCategoryName,
      }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.category.trim()) {
      alert('Please select or create a category');
      return;
    }

    if (!formData.before.trim() || !formData.during.trim() || !formData.after.trim()) {
      alert('Please fill in all three sections (Before, During, After)');
      return;
    }

    onSubmit(formData);

    // Reset form
    setFormData({
      title: '',
      category: categories[0] || '',
      isNewCategory: false,
      before: '',
      during: '',
      after: '',
    });
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          darkMode
            ? 'bg-neutral-900 border-neutral-800'
            : 'bg-white border-stone-200'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'border-neutral-800' : 'border-stone-200'
          }`}
        >
          <h2 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
            Create Knowledge Base Guide
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              darkMode
                ? 'hover:bg-neutral-800 text-stone-400'
                : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Guide Title
            </label>
            <input
              type="text"
              placeholder="e.g., Typhoon Safety Protocol"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className={`w-full text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600'
                  : 'border-stone-200 bg-stone-50 text-neutral-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Category
            </label>
            <div className="space-y-2">
              {!showNewCategoryInput ? (
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`flex-1 text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950 text-white'
                        : 'border-stone-200 bg-stone-50 text-neutral-900'
                    }`}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__new__">+ Create New Category</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(true);
                      handleCategoryChange('__new__');
                    }}
                    className="p-3 rounded-xl bg-[#038F8D] hover:bg-[#02706e] text-white transition flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600'
                        : 'border-stone-200 bg-stone-50 text-neutral-900 placeholder-stone-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-4 py-2 rounded-xl bg-[#038F8D] hover:bg-[#02706e] text-white text-xs font-bold transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                      setFormData((prev) => ({
                        ...prev,
                        category: categories[0] || '',
                        isNewCategory: false,
                      }));
                    }}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                      darkMode
                        ? 'border-neutral-800 text-stone-400 hover:bg-neutral-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Before Section */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              📋 Before Steps
            </label>
            <textarea
              placeholder="Describe preparation steps before the crisis..."
              value={formData.before}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  before: e.target.value,
                }))
              }
              rows={4}
              className={`w-full text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all resize-none ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600'
                  : 'border-stone-200 bg-stone-50 text-neutral-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* During Section */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              ⚡ During Steps
            </label>
            <textarea
              placeholder="Describe actions to take during the crisis..."
              value={formData.during}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  during: e.target.value,
                }))
              }
              rows={4}
              className={`w-full text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all resize-none ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600'
                  : 'border-stone-200 bg-stone-50 text-neutral-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* After Section */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              ✓ After Steps
            </label>
            <textarea
              placeholder="Describe recovery and follow-up steps after the crisis..."
              value={formData.after}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  after: e.target.value,
                }))
              }
              rows={4}
              className={`w-full text-sm p-3 rounded-xl border focus:outline-none focus:border-[#038F8D] transition-all resize-none ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600'
                  : 'border-stone-200 bg-stone-50 text-neutral-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-stone-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                darkMode
                  ? 'bg-neutral-800 text-stone-100 hover:bg-neutral-700'
                  : 'bg-stone-100 text-neutral-900 hover:bg-stone-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Create Guide</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KBCreationForm;
