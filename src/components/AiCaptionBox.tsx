import React, { useState } from 'react';
import { QUICK_TAGS } from '../constants/data';
import { Sparkles, Copy, Check, Hash, RefreshCw, MessageSquare } from 'lucide-react';

interface AiCaptionBoxProps {
  memo: string;
  onChangeMemo: (val: string) => void;
  aiCaption: string;
  onChangeAiCaption: (val: string) => void;
  hashtags: string[];
  suburb: string;
  locationName: string;
  productName: string;
  imageBase64: string | null;
  onCaptionGenerated: (caption: string, tags: string[]) => void;
}

export const AiCaptionBox: React.FC<AiCaptionBoxProps> = ({
  memo,
  onChangeMemo,
  aiCaption,
  onChangeAiCaption,
  hashtags,
  suburb,
  locationName,
  productName,
  imageBase64,
  onCaptionGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (memo.includes(tag)) {
      onChangeMemo(memo.replace(tag, '').replace(/\s+/g, ' ').trim());
    } else {
      onChangeMemo(memo ? `${memo} ${tag}` : tag);
    }
  };

  const handleGenerateCaption = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suburb,
          locationName,
          productName,
          memo,
          imageBase64: imageBase64 || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      const generatedFull = `${data.headline}\n\n${data.captionText}\n\n${data.hashtags?.join(' ') || ''}`;
      onChangeAiCaption(generatedFull);
      onCaptionGenerated(generatedFull, data.hashtags || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI 캡션 생성 중 문제가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = async () => {
    if (!aiCaption) return;
    try {
      await navigator.clipboard.writeText(aiCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = aiCaption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
              5
            </span>
            <span>현장 메모 & 캡션 힌트</span>
            <span className="text-xs text-slate-400 font-normal">(선택)</span>
          </label>
        </div>

        <textarea
          rows={2}
          value={memo}
          onChange={(e) => onChangeMemo(e.target.value)}
          placeholder="예: 화이트 모터라이즈드 전동, 매립 박스 시공, 깔끔한 주름 연출"
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
        />

        {/* Quick Tag Chips */}
        <div className="mt-2.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            자주 쓰는 시공 특징 태그 원클릭 추가:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const active = memo.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 text-xs rounded-md transition-colors whitespace-nowrap min-h-[30px] flex items-center gap-1 ${
                    active
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tag}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Instagram Caption Generator Section */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">AI 인스타그램 캡션 자동 생성</span>
              <span className="hidden sm:inline-block ml-1 text-[11px] text-slate-500">
                (Gemini 3.8 Flash)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateCaption}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 min-h-[38px]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI 작성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>캡션 생성하기</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {aiCaption ? (
          <div className="space-y-2 mt-2">
            <div className="relative">
              <textarea
                rows={5}
                value={aiCaption}
                onChange={(e) => onChangeAiCaption(e.target.value)}
                className="w-full p-3 bg-purple-50/40 border border-purple-200 rounded-lg text-xs leading-relaxed text-slate-800 font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all min-h-[32px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>캡션 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px] text-purple-700">
                {hashtags.slice(0, 10).map((h) => (
                  <span key={h} className="bg-purple-100/70 px-1.5 py-0.5 rounded">
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
            <span>시공 사진과 옵션을 기반으로 호주 현지 맞춤 인스타 캡션과 해시태그를 자동 작성합니다.</span>
          </div>
        )}
      </div>
    </div>
  );
};
