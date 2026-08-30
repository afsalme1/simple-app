import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Tag, Package, ChevronDown, Check, Sparkles, X, AlertCircle } from 'lucide-react';
import { Item } from '../../types';
import { formatINR } from '../../utils/gstEngine';

interface ItemDescriptionAutocompleteProps {
  value: string;
  items: Item[];
  onTextChange: (text: string) => void;
  onSelectItem: (item: Item) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const ItemDescriptionAutocomplete: React.FC<ItemDescriptionAutocompleteProps> = ({
  value,
  items,
  onTextChange,
  onSelectItem,
  placeholder = 'Type item name / description...',
  className = '',
  required = true,
  autoFocus = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Alphabetical sorting rule (A to Z) & Search filtering
  const filteredSortedItems = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    
    // Filter matching items
    let matched = items;
    if (query) {
      matched = items.filter(it => {
        const nameMatch = it.name.toLowerCase().includes(query);
        const hsnMatch = it.hsnSacCode?.toLowerCase().includes(query);
        const codeMatch = it.itemCode?.toLowerCase().includes(query);
        const descMatch = it.description?.toLowerCase().includes(query);
        return nameMatch || hsnMatch || codeMatch || descMatch;
      });
    }

    // Sort strictly in Alphabetical Order (A to Z) by Name
    return [...matched].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
    );
  }, [items, value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (item: Item) => {
    onSelectItem(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSortedItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : filteredSortedItems.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSortedItems.length) {
        e.preventDefault();
        handleSelect(filteredSortedItems[highlightedIndex]);
      } else {
        // Close dropdown and let user proceed with custom text
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Tab') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSortedItems.length) {
        handleSelect(filteredSortedItems[highlightedIndex]);
      }
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={value}
          onChange={e => {
            onTextChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-2.5 pr-14 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 font-medium placeholder-slate-400 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all shadow-2xs"
          autoComplete="off"
        />

        {/* Action icons right inside input */}
        <div className="absolute right-1.5 flex items-center gap-1 text-slate-400">
          {value && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onTextChange('');
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              className="p-0.5 hover:text-slate-600 rounded cursor-pointer"
              title="Clear text"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen(prev => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-0.5 hover:text-teal-600 rounded cursor-pointer"
            title="Toggle item list (A-Z)"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 min-w-[320px] max-w-[460px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Bar showing Alphabetical indicator & match count */}
          <div className="px-3 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>Catalog Items (A → Z)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {filteredSortedItems.length} {filteredSortedItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Items List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredSortedItems.length > 0 ? (
              filteredSortedItems.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const isGoods = item.itemType === 'GOODS';
                const isOutOfStock = isGoods && item.currentStock <= 0;
                const isLowStock = isGoods && item.minStockAlert && item.currentStock <= item.minStockAlert;

                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      // Prevent input blur before click registers
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 cursor-pointer transition-colors flex flex-col gap-1 ${
                      isHighlighted
                        ? 'bg-teal-50/90 text-teal-950 border-l-3 border-teal-600 pl-2'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Top row: Item Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-teal-700 text-xs">
                          {formatINR(item.sellingPrice)}
                        </div>
                        {item.purchasePrice ? (
                          <div className="text-[10px] text-slate-600 font-mono">
                            Cost: ₹{item.purchasePrice}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom row: HSN, GST %, Stock & Unit badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono rounded font-medium border border-slate-200">
                        HSN: {item.hsnSacCode}
                      </span>

                      <span className="px-1.5 py-0.5 bg-teal-100/70 text-teal-800 font-bold rounded">
                        {item.gstRate}% GST
                      </span>

                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium rounded uppercase">
                        {item.unit}
                      </span>

                      {isGoods && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100/70 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : `Stock: ${item.currentStock} ${item.unit}`}
                        </span>
                      )}

                      {item.itemCode && (
                        <span className="text-slate-600 font-mono text-[9.5px]">
                          SKU: {item.itemCode}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-500 space-y-2">
                <p className="text-xs">No matching catalog item found for <strong className="text-slate-800 font-medium">"{value}"</strong>.</p>
                <div className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200 inline-block">
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Free-form Entry Supported</span>
                  </div>
                  <p className="text-[10px] text-teal-800 mt-0.5">You can keep this custom title and fill in HSN, Qty & Rate manually.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Footer with Keyboard Tips */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
            <span>Use <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[9px]">↑</kbd> <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[9px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[9px]">Enter</kbd> to select</span>
          </div>
        </div>
      )}
    </div>
  );
};
