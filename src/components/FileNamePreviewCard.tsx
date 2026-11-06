import React, { useState } from 'react';
import { Copy, Check, Download, FileText, CheckCircle2 } from 'lucide-react';

interface FileNamePreviewCardProps {
  fileName: string;
  suburb: string;
  fullLocation: string;
  productCode: string;
  file: File | null;
  onDownloadDone?: () => void;
}

export const FileNamePreviewCard: React.FC<FileNamePreviewCardProps> = ({
  fileName,
  suburb,
  fullLocation,
  productCode,
  file,
  onDownloadDone,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fileName;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
    if (onDownloadDone) onDownloadDone();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-2 border-blue-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">
            자동 생성 파일명 (Standardized Naming)
          </span>
        </div>
        <span className="text-[11px] text-blue-700/80 font-medium">규격화 완료</span>
      </div>

      {/* Main Filename Display Box */}
      <div className="bg-white border border-blue-200 rounded-lg p-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="font-mono text-base sm:text-lg font-bold text-blue-950 tracking-tight break-all select-all">
          {fileName}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>파일명 복사</span>
              </>
            )}
          </button>

          {file && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[36px]"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>다운로드 완료!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>사진 다운로드</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Breakdown Guide */}
      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
        <div className="bg-white/80 p-2 rounded border border-blue-100">
          <span className="text-slate-400 block text-[10px]">1. 지역(Suburb)</span>
          <span className="font-mono font-semibold text-slate-800 truncate block">
            {suburb || '-'}
          </span>
        </div>
        <div className="bg-white/80 p-2 rounded border border-blue-100">
          <span className="text-slate-400 block text-[10px]">2. 공간+창문(Loc)</span>
          <span className="font-mono font-semibold text-slate-800 truncate block">
            {fullLocation || '-'}
          </span>
        </div>
        <div className="bg-white/80 p-2 rounded border border-blue-100">
          <span className="text-slate-400 block text-[10px]">3. 제품코드(Prod)</span>
          <span className="font-mono font-semibold text-slate-800 truncate block">
            {productCode || '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
