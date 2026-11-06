import React from 'react';
import { POSTCODE_DATABASE, cleanText } from '../constants/data';
import { MapPin, Search } from 'lucide-react';

interface LocationSelectorProps {
  postcode: string;
  suburb: string;
  onChangePostcode: (val: string) => void;
  onChangeSuburb: (val: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  postcode,
  suburb,
  onChangePostcode,
  onChangeSuburb,
}) => {
  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    onChangePostcode(val);

    // Auto-match suburb if known postcode
    const matched = POSTCODE_DATABASE.find((item) => item.postcode === val);
    if (matched) {
      onChangeSuburb(matched.suburb);
    }
  };

  const handleSelectQuickSuburb = (entry: typeof POSTCODE_DATABASE[0]) => {
    onChangePostcode(entry.postcode);
    onChangeSuburb(entry.suburb);
  };

  const cleanedSuburb = cleanText(suburb) || 'Hills';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
            2
          </span>
          <span>현장 지역 (Postcode & Suburb)</span>
          <span className="text-xs text-rose-500 font-normal">*필수</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">Hills District & Sydney</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            우편번호 (Postcode)
          </label>
          <div className="relative">
            <input
              type="text"
              list="suburbSuggestions"
              value={postcode}
              onChange={handlePostcodeChange}
              placeholder="예: 2154"
              maxLength={4}
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <datalist id="suburbSuggestions">
              {POSTCODE_DATABASE.map((item) => (
                <option key={item.postcode} value={item.postcode}>
                  {item.display}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            지역명 (Suburb)
          </label>
          <div className="relative">
            <input
              type="text"
              value={suburb}
              onChange={(e) => onChangeSuburb(e.target.value)}
              placeholder="예: Castle Hill"
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Select Chips */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>자주 시공하는 주요 힐스 지역 원클릭 선택:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POSTCODE_DATABASE.slice(0, 8).map((item) => {
            const isSelected = postcode === item.postcode;
            return (
              <button
                key={item.postcode}
                type="button"
                onClick={() => handleSelectQuickSuburb(item)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap min-h-[32px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {item.suburb} ({item.postcode})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
        <span>규격 파일명 변환 접두사:</span>
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {cleanedSuburb}
        </span>
      </div>
    </div>
  );
};
