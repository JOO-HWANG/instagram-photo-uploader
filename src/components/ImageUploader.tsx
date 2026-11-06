import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Maximize2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from '../constants/data';

interface ImageUploaderProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  file,
  previewUrl,
  onFileSelect,
  onClear,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        onFileSelect(droppedFile);
      }
    }
  };

  // Helper: Generates a realistic sample blind/curtain photo on an HTML5 canvas for quick field testing
  const generateSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background modern living room wall
    const grad = ctx.createLinearGradient(0, 0, 1200, 900);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 900);

    // Floor
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 750, 1200, 150);

    // Window frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(250, 80, 700, 620);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(270, 100, 660, 580);

    // Outdoor scenery through window (hills / sky)
    const skyGrad = ctx.createLinearGradient(0, 100, 0, 680);
    skyGrad.addColorStop(0, '#bae6fd');
    skyGrad.addColorStop(0.7, '#e0f2fe');
    skyGrad.addColorStop(1, '#a7f3d0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(270, 100, 660, 580);

    // Blinds slats / fabric
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(280, 110, 640, 480);

    // Blind cord & details
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    for (let y = 140; y < 580; y += 30) {
      ctx.beginPath();
      ctx.moveTo(280, y);
      ctx.lineTo(920, y);
      ctx.stroke();
    }

    // Modern watermark / tag
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Hills Blind Lab - On-Site Installation', 300, 70);

    ctx.fillStyle = '#475569';
    ctx.font = '24px sans-serif';
    ctx.fillText('Custom Sunscreen Roller Blind & Sheer Sample', 300, 800);

    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'hills_blind_sample.jpg', { type: 'image/jpeg' });
        onFileSelect(sampleFile);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
            1
          </span>
          <span>시공 사진 촬영 및 선택</span>
          <span className="text-xs text-rose-500 font-normal">*필수</span>
        </label>

        {!file && (
          <button
            type="button"
            onClick={generateSampleImage}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline py-1 px-2 rounded-md hover:bg-slate-50 min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>샘플 사진 넣기</span>
          </button>
        )}
      </div>

      {/* Hidden native inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When no file selected */}
      {!previewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          <div className="max-w-xs mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-slate-700">
              <Camera className="w-6 h-6" />
            </div>

            <div className="text-xs text-slate-600">
              현장에서 시공 완료된 창문 전체가 잘 보이도록 촬영하거나 갤러리에서 선택해주세요.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full min-h-[46px] px-3 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>카메라 촬영</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[46px] px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>앨범 선택</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview state */
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
            <img
              src={previewUrl}
              alt="시공 현장 사진 미리보기"
              className="w-full max-h-72 object-contain mx-auto"
            />

            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowZoomModal(true)}
                title="크게 보기"
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClear}
                title="사진 삭제"
                className="p-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-lg backdrop-blur-xs min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[11px] px-2 py-1 rounded-md flex items-center gap-2">
              <span className="truncate max-w-[150px]">{file?.name}</span>
              <span>·</span>
              <span className="font-mono">{formatFileSize(file?.size)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              ✓ 사진 준비 완료
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-slate-600 hover:text-slate-900 underline font-medium py-1 px-1.5 min-h-[36px]"
              >
                다시 촬영
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-600 hover:text-slate-900 underline font-medium py-1 px-1.5 min-h-[36px]"
              >
                다른 사진 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom */}
      {showZoomModal && previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="확대 미리보기"
              className="max-w-full max-h-[82vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowZoomModal(false)}
              className="mt-3 px-5 py-2 bg-white text-slate-900 font-semibold text-sm rounded-lg mx-auto block min-h-[44px]"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
