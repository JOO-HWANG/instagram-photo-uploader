import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { Clock, Download, Copy, Check, Trash2, CheckCircle2, XCircle, ArrowLeft, ImageOff, HardDrive } from 'lucide-react';

interface UploadHistoryProps {
  history: HistoryRecord[];
  onClearHistory: () => void;
  onBackToUpload: () => void;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  history,
  onClearHistory,
  onBackToUpload,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = (record: HistoryRecord) => {
    if (!record.filePreviewUrl) return;
    const a = document.createElement('a');
    a.href = record.filePreviewUrl;
    a.download = record.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToUpload}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900">현장 시공 업로드 기록</h2>
            <p className="text-xs text-slate-500">
              최근 작업한 {history.length}건의 사진 및 파일명 목록
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 hover:underline py-1 px-2 rounded min-h-[36px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>기록 비우기</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-800">아직 전송된 현장 기록이 없습니다</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            새 시공 사진을 등록하고 인스타그램 자동 포스팅을 전송하거나 사진을 다운로드하면 이곳에 기록됩니다.
          </p>
          <button
            type="button"
            onClick={onBackToUpload}
            className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors min-h-[40px]"
          >
            시공 사진 업로드하러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {item.filePreviewUrl ? (
                    <img
                      src={item.filePreviewUrl}
                      alt={item.fileName}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {item.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{item.suburb}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-semibold text-slate-700">{item.locationFull}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-blue-600">{item.productCode}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {dateStr}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {item.driveStatus === 'success' && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Drive 저장됨
                    </span>
                  )}
                  {item.webhookStatus === 'success' && !item.driveStatus && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      전송완료
                    </span>
                  )}
                  {item.webhookStatus === 'failed' && (
                    <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      실패
                    </span>
                  )}
                  {item.webhookStatus === 'downloaded-only' && !item.driveStatus && (
                    <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      저장됨
                    </span>
                  )}

                  {item.driveWebViewLink && (
                    <a
                      href={item.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Google Drive에서 열기"
                      className="p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <HardDrive className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.fileName)}
                    title="파일명 복사"
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {item.filePreviewUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      title="사진 다운로드"
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
