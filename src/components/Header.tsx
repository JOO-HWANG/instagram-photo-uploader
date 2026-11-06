import React from 'react';
import { Camera, History, Settings, ExternalLink } from 'lucide-react';

interface HeaderProps {
  activeTab: 'uploader' | 'history';
  setActiveTab: (tab: 'uploader' | 'history') => void;
  onOpenSettings: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            H
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Hills Blind Lab
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium">
              Field Upload Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Tab toggles */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('uploader')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[38px] ${
              activeTab === 'uploader'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>현장 업로드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[38px] ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>최근 내역</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-200 text-slate-800 rounded font-semibold tabular-nums">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            title="n8n 웹훅 설정"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className="w-4 h-4" />
            <span className="sr-only">웹훅 설정</span>
          </button>
        </div>
      </div>
    </header>
  );
};
