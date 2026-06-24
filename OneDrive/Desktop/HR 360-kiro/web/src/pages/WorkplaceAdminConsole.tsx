import React from 'react';
import { Shield, Map, LayoutTemplate } from 'lucide-react';

const WorkplaceAdminConsole: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#038F8D]/10 rounded-xl text-[#038F8D]">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Workplace Admin Console</h1>
          <p className="text-stone-500 dark:text-stone-400">Manage site resources, escape maps, and operational notices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Escape Map Manager */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Map size={20} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Escape Map Manager</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Upload physical site emergency evacuation floor plans and blueprint assets.
            </p>

            <div className="border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-xl p-8 text-center hover:border-[#038F8D] dark:hover:border-[#038F8D] transition cursor-pointer">
              <input type="file" className="hidden" id="escape-map-upload" accept="image/*,.pdf" />
              <label htmlFor="escape-map-upload" className="cursor-pointer">
                <div className="mx-auto w-12 h-12 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📁</span>
                </div>
                <span className="block text-sm font-semibold text-[#038F8D]">Click to upload</span>
                <span className="block text-xs text-stone-500 mt-1">PNG, JPG, or PDF (max 10MB)</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="px-4 py-2 bg-[#038F8D] text-white rounded-lg font-medium text-sm hover:bg-[#027574] transition">
                Process & Save Map
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Resource Card Engine */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <LayoutTemplate size={20} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Dynamic Resource Card Engine</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
              Append or manage custom resource widgets on the Check Resources view.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">Card Header</label>
                <input
                  type="text"
                  placeholder="e.g., Evacuation Transport"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#038F8D]/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">Description / Paragraph</label>
                <textarea
                  rows={3}
                  placeholder="Details about the resource..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#038F8D]/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">Upload Graphic Asset</label>
                <div className="flex items-center gap-3">
                  <input type="file" className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#038F8D]/10 file:text-[#038F8D] hover:file:bg-[#038F8D]/20 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="px-4 py-2 bg-[#038F8D] text-white rounded-lg font-medium text-sm hover:bg-[#027574] transition">
                Add Resource Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkplaceAdminConsole;