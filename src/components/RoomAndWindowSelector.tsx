import React, { useState } from 'react';
import { ROOM_OPTIONS, WINDOW_SEQ_OPTIONS } from '../constants/data';
import { Compass, HelpCircle } from 'lucide-react';

interface RoomAndWindowSelectorProps {
  locationCode: string;
  windowSeq: string;
  onChangeLocation: (code: string) => void;
  onChangeWindowSeq: (seq: string) => void;
}

export const RoomAndWindowSelector: React.FC<RoomAndWindowSelectorProps> = ({
  locationCode,
  windowSeq,
  onChangeLocation,
  onChangeWindowSeq,
}) => {
  const [showClockwiseGuide, setShowClockwiseGuide] = useState(false);

  const selectedRoom = ROOM_OPTIONS.find((r) => r.code === locationCode);
  const fullLocationCode = windowSeq ? `${locationCode}${windowSeq}` : locationCode;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
            3
          </span>
          <span>시공 공간 (Location) & 윈도우 순번</span>
        </label>

        <button
          type="button"
          onClick={() => setShowClockwiseGuide(!showClockwiseGuide)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline py-1 px-1.5 rounded min-h-[36px]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>시계방향 룰 안내</span>
        </button>
      </div>

      {showClockwiseGuide && (
        <div className="mb-3.5 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600 shrink-0" />
            <span>창문 시계방향(Clockwise) 넘버링 규칙</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            한 공간(예: 거실, 안방)에 여러 개의 창이 설치된 경우, <strong>방 출입구(문)에 서서 왼쪽부터 시계방향(Clockwise)</strong> 순서로 창문 번호를 매깁니다 (1번 → 2번 → 3번...).
          </p>
          <p className="text-[11px] text-blue-700">
            예시: 거실의 첫번째 창은 <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">L1</code>, 단일 통창인 경우 번호 없이 <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">L</code>로 기록됩니다.
          </p>
        </div>
      )}

      {/* Main Select Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Room selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            공간 선택 (Room Location)
          </label>
          <select
            value={locationCode}
            onChange={(e) => onChangeLocation(e.target.value)}
            className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {ROOM_OPTIONS.map((room) => (
              <option key={room.code} value={room.code}>
                {room.code} - {room.nameKo} ({room.name})
              </option>
            ))}
          </select>
        </div>

        {/* Window Sequence */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            창문 순번 (Window Sequence)
          </label>
          <select
            value={windowSeq}
            onChange={(e) => onChangeWindowSeq(e.target.value)}
            className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {WINDOW_SEQ_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.desc ? `(${opt.desc})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Select Buttons for most common rooms */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-500 mb-2">
          공간 빠른 전환:
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {ROOM_OPTIONS.slice(0, 6).map((room) => {
            const isSelected = locationCode === room.code;
            return (
              <button
                key={room.code}
                type="button"
                onClick={() => onChangeLocation(room.code)}
                className={`px-2 py-1.5 text-xs rounded-lg transition-all text-center min-h-[38px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                }`}
              >
                <span className="font-mono text-xs">{room.code}</span>
                <span className="text-[10px] opacity-80 truncate">{room.nameKo.split('/')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
        <span>선택된 공간 규격 코드:</span>
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {fullLocationCode} ({selectedRoom?.nameKo || ''})
        </span>
      </div>
    </div>
  );
};
