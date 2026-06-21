import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ToGoKitItem {
  id: string;
  name: string;
  category: 'Survival' | 'Medical' | 'Documents' | 'Personal' | 'Other';
  quantity: number;
  checked: boolean;
}

const MobileToBag: React.FC = () => {
  const navigate = useNavigate();

  // 1. Core State Managers
  const [kitItems, setKitItems] = useState<ToGoKitItem[]>([
    {
      id: '1',
      name: 'Water Bottle (1L)',
      category: 'Survival',
      quantity: 2,
      checked: true,
    },
    {
      id: '2',
      name: 'First Aid Bandages Pack',
      category: 'Medical',
      quantity: 1,
      checked: true,
    },
    {
      id: '3',
      name: 'N95 Respirator Masks',
      category: 'Medical',
      quantity: 4,
      checked: false,
    },
    {
      id: '4',
      name: 'Power Bank (10,000mAh)',
      category: 'Survival',
      quantity: 1,
      checked: false,
    },
    {
      id: '5',
      name: 'Photocopies of Government IDs',
      category: 'Documents',
      quantity: 1,
      checked: false,
    },
  ]);

  const [newKitName, setNewKitName] = useState('');
  const [newKitCategory, setNewKitCategory] = useState<ToGoKitItem['category']>(
    'Survival'
  );
  const [newKitQty, setNewKitQty] = useState(1);

  // 2. Calculations
  const totalKitItems = kitItems.length;
  const completedKitItems = kitItems.filter((item) => item.checked).length;
  const kitPercent =
    totalKitItems > 0
      ? Math.round((completedKitItems / totalKitItems) * 100)
      : 0;

  // 3. Action Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKitName.trim()) return;

    const newItem: ToGoKitItem = {
      id: `kit-${Date.now()}`,
      name: newKitName,
      category: newKitCategory,
      quantity: newKitQty,
      checked: false,
    };

    setKitItems([newItem, ...kitItems]);
    setNewKitName('');
    setNewKitQty(1);
  };

  const handleToggleCheck = (id: string) => {
    setKitItems((p) =>
      p.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setKitItems((p) => p.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950 px-4 py-6 pb-24">
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-850 transition text-neutral-700 dark:text-neutral-300"
        >
          ←
        </button>
        <div>
          <h1 className="font-extrabold text-lg text-[#038F8D] dark:text-[#49D7D1]">
            Go-Bag Survival Kit
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-neutral-500">
            Add, track, and update your survival essentials
          </p>
        </div>
      </header>

      {/* DYNAMIC READINESS PROGRESS WIDGET */}
      <div className="p-4 bg-[#038F8D]/5 dark:bg-[#038F8D]/10 border border-[#038F8D]/25 dark:border-[#038F8D]/15 rounded-2xl flex items-center justify-between mb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-[#038F8D] dark:text-[#49D7D1] font-bold uppercase tracking-widest block">
            Kit Readiness
          </span>
          <h3 className="text-2xl font-extrabold text-neutral-850 dark:text-stone-100">
            {kitPercent}%{' '}
            <span className="text-xs font-normal text-stone-700 dark:text-neutral-500">
              equipped
            </span>
          </h3>
          <p className="text-[10px] text-stone-400 dark:text-neutral-500 font-medium">
            {completedKitItems} of {totalKitItems} items validated
          </p>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-[#9AC0C3] dark:border-[#1a5a57] flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-full border-4 border-[#038F8D]"
            style={{
              clip: 'circle(50% at 50% 50%)',
              transform: `rotate(${Math.min(kitPercent * 3.6, 360)}deg)`,
            }}
          />
          <span className="text-2xl z-10">🎒</span>
        </div>
      </div>

      {/* INTERACTIVE ADDITION FORM */}
      <form
        onSubmit={handleAddItem}
        className="p-4 bg-white dark:bg-neutral-900 border border-stone-150 dark:border-neutral-800 rounded-2xl space-y-3 shadow-sm mb-6"
      >
        <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          ➕ Register Go-Bag Necessity
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="e.g. Can Opener"
            value={newKitName}
            required
            onChange={(e) => setNewKitName(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 col-span-2 text-neutral-800 dark:text-stone-100 focus:outline-none focus:border-[#038F8D] focus:ring-1 focus:ring-[#038F8D]/20 placeholder-stone-400 dark:placeholder-neutral-600"
          />
          <select
            value={newKitCategory}
            onChange={(e: any) => setNewKitCategory(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-stone-900 dark:text-stone-100 cursor-pointer focus:outline-none focus:border-[#038F8D] focus:ring-1 focus:ring-[#038F8D]/20"
          >
            <option value="Survival">🌲 Survival</option>
            <option value="Medical">🩺 Medical</option>
            <option value="Documents">📑 Documents</option>
            <option value="Personal">🔑 Personal</option>
            <option value="Other">🎒 Other</option>
          </select>
          <div className="flex border border-stone-200 dark:border-neutral-800 rounded-xl overflow-hidden text-center text-xs justify-between items-center bg-stone-50 dark:bg-neutral-950 px-2 text-stone-900 dark:text-stone-150">
            <span className="text-[10px] text-stone-700 dark:text-neutral-500 font-bold">
              Qty:
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={newKitQty}
              onChange={(e) => setNewKitQty(Number(e.target.value))}
              className="w-8 text-center font-bold focus:outline-none bg-transparent text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-[#038F8D] hover:bg-[#027574] dark:hover:bg-[#049c99] text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          Add Essential to bag
        </button>
      </form>

      {/* SCROLLABLE CHECKLIST DYNAMIC DISPLAY */}
      <div className="space-y-2">
        {kitItems.length === 0 ? (
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-150 dark:border-neutral-850 text-center">
            <p className="text-sm text-stone-400 dark:text-neutral-500">
              No items in your go-bag yet. Add essentials to get started!
            </p>
          </div>
        ) : (
          kitItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                item.checked
                  ? 'bg-stone-50 dark:bg-neutral-900/60 border-stone-100 dark:border-neutral-850 opacity-70'
                  : 'bg-white dark:bg-neutral-900 border-stone-150 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleCheck(item.id)}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    item.checked
                      ? 'bg-[#038F8D] border-[#038F8D] text-white'
                      : 'border-stone-250 dark:border-neutral-700 hover:border-[#038F8D]'
                  }`}
                >
                  {item.checked && <span>✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold tracking-tight ${
                      item.checked
                        ? 'line-through text-stone-400 dark:text-neutral-600'
                        : 'text-stone-900 dark:text-stone-200'
                    }`}
                  >
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400 font-bold">
                      {item.category}
                    </span>
                    <span className="text-[9px] text-stone-700 dark:text-neutral-500">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="text-stone-300 dark:text-neutral-700 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0"
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileToBag;
