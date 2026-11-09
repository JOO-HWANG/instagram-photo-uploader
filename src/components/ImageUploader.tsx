import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Maximize2,
  Sparkles,
  Crop,
  CheckCircle2,
  AlertTriangle,
  Move,
} from 'lucide-react';
import { formatFileSize } from '../constants/data';
import { ImageCropModal } from './ImageCropModal';

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
  const [showCropModal, setShowCropModal] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);

  // When a new file is uploaded from outside, track it as original
  const handleNewUpload = (newFile: File) => {
    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    const origUrl = URL.createObjectURL(newFile);
    setOriginalFile(newFile);
    setOriginalPreviewUrl(origUrl);
    onFileSelect(newFile);
  };

  const handleClearAll = () => {
    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    setOriginalFile(null);
    setOriginalPreviewUrl(null);
    onClear();
  };

  const handleRestoreOriginal = () => {
    if (originalFile) {
      onFileSelect(originalFile);
    }
  };

  // Read natural image dimensions whenever previewUrl changes
  useEffect(() => {
    if (!previewUrl) {
      setDimensions(null);
      return;
    }
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [previewUrl]);

  // Check if image is 4:5 aspect ratio (0.80 ± 0.03)
  const is4by5 = dimensions
    ? Math.abs(dimensions.width / dimensions.height - 0.8) <= 0.03
    : false;

  const isCroppedFromOriginal = originalFile && file && originalFile !== file;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        handleNewUpload(droppedFile);
      }
    }
  };

  // Helper: Generates a realistic sample blind/curtain photo directly in 4:5 (1080 x 1350 px)
  const generateSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background wall
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Floor (oak timber / tile)
    const floorGrad = ctx.createLinearGradient(0, 1100, 0, 1350);
    floorGrad.addColorStop(0, '#cbd5e1');
    floorGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 1100, 1080, 250);

    // Pelmet / Recessed Box at top
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(100, 100, 880, 70);

    // Big Window Opening
    const skyGrad = ctx.createLinearGradient(0, 170, 0, 1080);
    skyGrad.addColorStop(0, '#bae6fd');
    skyGrad.addColorStop(0.6, '#e0f2fe');
    skyGrad.addColorStop(1, '#bbf7d0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(120, 170, 840, 910);

    // Modern Sunscreen Roller Blind & Sheer Layer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(130, 170, 820, 750);

    // Fabric Texture Slats
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    for (let y = 200; y < 920; y += 40) {
      ctx.beginPath();
      ctx.moveTo(130, y);
      ctx.lineTo(950, y);
      ctx.stroke();
    }

    // Bottom Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(130, 920, 820, 20);

    // Branding & Badge
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('Hills Blind Lab - On-Site Installation', 150, 80);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('4:5 Portrait Ratio (1080 x 1350 px)', 150, 1000);

    ctx.fillStyle = '#475569';
    ctx.font = '22px sans-serif';
    ctx.fillText('Premium Blockout & Sheer Wave Installation', 150, 1040);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'hills_blind_4x5_sample.jpg', {
            type: 'image/jpeg',
          });
          handleNewUpload(sampleFile);
        }
      },
      'image/jpeg',
      0.94
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
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
            <span>4:5 샘플 사진 넣기</span>
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

            <div className="space-y-1">
              <div className="text-xs text-slate-700 font-semibold">
                현장 시공 완료 사진 촬영 또는 앨범 선택
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                사진은 원본 그대로 등록되며, 원하실 때 인스타그램 최적 규격인 <strong>4:5 (1080×1350 px)</strong> 크롭 영역을 직접 지정할 수 있습니다.
              </div>
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
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group flex items-center justify-center">
            <img
              src={previewUrl}
              alt="시공 현장 사진 미리보기"
              className="max-h-80 w-auto object-contain mx-auto"
            />

            {/* Quick Actions (Zoom, Crop, Delete) */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCropModal(true)}
                title="4:5 (1080x1350) 크롭 위치 직접 지정"
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg backdrop-blur-xs text-xs font-semibold flex items-center gap-1 shadow-md transition-colors min-h-[36px]"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{isCroppedFromOriginal ? '크롭 영역 재조정' : '4:5 직접 크롭'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowZoomModal(true)}
                title="크게 보기"
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                title="사진 삭제"
                className="p-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-lg backdrop-blur-xs min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Resolution and ratio badge */}
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-2">
              <span className="truncate max-w-[140px] font-mono">{file?.name}</span>
              <span>·</span>
              {dimensions && (
                <span className="font-mono font-semibold">
                  {dimensions.width}×{dimensions.height}px
                </span>
              )}
              <span>·</span>
              <span className="font-mono">{formatFileSize(file?.size)}</span>
              {isCroppedFromOriginal && (
                <>
                  <span>·</span>
                  <span className="text-emerald-300 font-bold">4:5 크롭 적용됨</span>
                </>
              )}
            </div>
          </div>

          {/* Aspect Ratio Status Notification Banner */}
          {dimensions && (
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                is4by5
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                {is4by5 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="leading-tight">
                  <span className="font-bold">
                    {is4by5
                      ? '인스타그램 4:5 최적 비율 (1080×1350 px)'
                      : `현재 사진 비율: ${dimensions.width}×${dimensions.height} px`}
                  </span>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {is4by5
                      ? '모바일 피드를 꽉 채워 시공 마감 디테일이 가장 눈에 띕니다.'
                      : '사진이 잘리지 않고 보존되어 있습니다. 원하시면 원하는 부위를 직접 드래그하여 4:5로 맞출 수 있습니다.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {isCroppedFromOriginal && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginal}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all min-h-[36px]"
                    title="크롭 전 원본 사진으로 되돌립니다"
                  >
                    원본 사진으로 복원
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs min-h-[36px] shrink-0 ${
                    is4by5
                      ? 'bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>{is4by5 ? '크롭 영역 다시 지정' : '4:5 크롭 영역 직접 지정'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              ✓ 사진 준비 완료 {isCroppedFromOriginal && '(4:5 규격 적용)'}
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

      {/* 4:5 Crop Modal (Always crops from original image) */}
      {(originalFile || file) && (originalPreviewUrl || previewUrl) && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => setShowCropModal(false)}
          file={originalFile || file!}
          previewUrl={originalPreviewUrl || previewUrl!}
          onApplyCrop={(croppedFile) => {
            onFileSelect(croppedFile);
          }}
        />
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
