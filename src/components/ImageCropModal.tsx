import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Check,
  X,
  Maximize2,
  Move,
  ArrowUp,
  ArrowDown,
  AlignCenter,
  Sparkles,
  Crop,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  previewUrl: string;
  onApplyCrop: (croppedFile: File) => void;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  file,
  previewUrl,
  onApplyCrop,
}) => {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [rotatedDataUrl, setRotatedDataUrl] = useState<string>(previewUrl);
  const [imgDisplaySize, setImgDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 240, height: 300 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isDraggingRef = useRef(false);
  const dragHandleRef = useRef<DragHandle | null>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const startCropRef = useRef<CropBox>({ x: 0, y: 0, width: 0, height: 0 });

  // Handle Rotation by rendering to an intermediate canvas
  const handleRotate = useCallback(() => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const isSideways = nextRotation === 90 || nextRotation === 270;
      canvas.width = isSideways ? img.naturalHeight : img.naturalWidth;
      canvas.height = isSideways ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((nextRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const rotatedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setRotatedDataUrl(rotatedUrl);
    };
  }, [previewUrl, rotation]);

  // When rotated image or previewUrl changes, load natural dimensions and measure displayed size
  useEffect(() => {
    if (!rotatedDataUrl) return;

    const img = new Image();
    img.src = rotatedDataUrl;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [rotatedDataUrl]);

  // Initialize crop box to the largest 4:5 rectangle that fits inside displayed image
  const initializeCropBox = useCallback((dispW: number, dispH: number) => {
    // 4:5 ratio means width = height * 0.8
    let w = Math.min(dispW, dispH * 0.8);
    let h = w * 1.25;

    // Safety clamp
    if (h > dispH) {
      h = dispH;
      w = h * 0.8;
    }

    const x = Math.max(0, (dispW - w) / 2);
    const y = Math.max(0, (dispH - h) / 2);

    setCrop({ x, y, width: w, height: h });
  }, []);

  // Update displayed size on image load / window resize
  const updateImageDisplaySize = useCallback(() => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setImgDisplaySize({ width: rect.width, height: rect.height });
      initializeCropBox(rect.width, rect.height);
    }
  }, [initializeCropBox]);

  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setRotatedDataUrl(previewUrl);
    }
  }, [isOpen, previewUrl]);

  // Drag interaction handlers
  const handleStartDrag = (handle: DragHandle, clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragHandleRef.current = handle;
    dragStartPosRef.current = { clientX, clientY };
    startCropRef.current = { ...crop };
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDraggingRef.current || !imgDisplaySize || !dragHandleRef.current) return;

      const dx = clientX - dragStartPosRef.current.clientX;
      const dy = clientY - dragStartPosRef.current.clientY;
      const start = startCropRef.current;
      const maxW = imgDisplaySize.width;
      const maxH = imgDisplaySize.height;

      if (dragHandleRef.current === 'move') {
        const nextX = Math.max(0, Math.min(maxW - start.width, start.x + dx));
        const nextY = Math.max(0, Math.min(maxH - start.height, start.y + dy));
        setCrop({
          ...start,
          x: nextX,
          y: nextY,
        });
        return;
      }

      // Resizing with fixed 4:5 ratio (width / height = 0.8, height = width * 1.25)
      const minBoxWidth = 60;

      if (dragHandleRef.current === 'se') {
        // Bottom-Right handle
        let newW = Math.max(minBoxWidth, start.width + dx);
        let newH = newW * 1.25;

        if (start.x + newW > maxW) {
          newW = maxW - start.x;
          newH = newW * 1.25;
        }
        if (start.y + newH > maxH) {
          newH = maxH - start.y;
          newW = newH * 0.8;
        }

        setCrop({
          x: start.x,
          y: start.y,
          width: newW,
          height: newH,
        });
      } else if (dragHandleRef.current === 'sw') {
        // Bottom-Left handle
        let newW = Math.max(minBoxWidth, start.width - dx);
        let newH = newW * 1.25;

        let newX = start.x + (start.width - newW);
        if (newX < 0) {
          newX = 0;
          newW = start.x + start.width;
          newH = newW * 1.25;
        }
        if (start.y + newH > maxH) {
          newH = maxH - start.y;
          newW = newH * 0.8;
          newX = start.x + (start.width - newW);
        }

        setCrop({
          x: newX,
          y: start.y,
          width: newW,
          height: newH,
        });
      } else if (dragHandleRef.current === 'ne') {
        // Top-Right handle
        let newW = Math.max(minBoxWidth, start.width + dx);
        let newH = newW * 1.25;

        let newY = start.y + (start.height - newH);
        if (start.x + newW > maxW) {
          newW = maxW - start.x;
          newH = newW * 1.25;
          newY = start.y + (start.height - newH);
        }
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.height;
          newW = newH * 0.8;
        }

        setCrop({
          x: start.x,
          y: newY,
          width: newW,
          height: newH,
        });
      } else if (dragHandleRef.current === 'nw') {
        // Top-Left handle
        let newW = Math.max(minBoxWidth, start.width - dx);
        let newH = newW * 1.25;

        let newX = start.x + (start.width - newW);
        let newY = start.y + (start.height - newH);

        if (newX < 0) {
          newX = 0;
          newW = start.x + start.width;
          newH = newW * 1.25;
          newY = start.y + (start.height - newH);
        }
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.height;
          newW = newH * 0.8;
          newX = start.x + (start.width - newW);
        }

        setCrop({
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      }
    },
    [imgDisplaySize]
  );

  const handlePointerEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragHandleRef.current = null;
  }, []);

  // Window listeners for smooth drag even outside element
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerEnd();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePointerMove, handlePointerEnd]);

  // Quick Preset Alignments
  const handlePreset = (type: 'max' | 'top' | 'center' | 'bottom') => {
    if (!imgDisplaySize) return;
    const dispW = imgDisplaySize.width;
    const dispH = imgDisplaySize.height;

    if (type === 'max') {
      initializeCropBox(dispW, dispH);
      return;
    }

    const currentW = crop.width;
    const currentH = crop.height;

    let targetX = (dispW - currentW) / 2;
    let targetY = (dispH - currentH) / 2;

    if (type === 'top') {
      targetY = 0;
    } else if (type === 'bottom') {
      targetY = dispH - currentH;
    }

    setCrop({
      x: Math.max(0, targetX),
      y: Math.max(0, targetY),
      width: currentW,
      height: currentH,
    });
  };

  // Apply Crop and output exact 1080 x 1350 px
  const handleApply = () => {
    if (!imgDisplaySize || !naturalSize) return;

    const scaleX = naturalSize.width / imgDisplaySize.width;
    const scaleY = naturalSize.height / imgDisplaySize.height;

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceW = crop.width * scaleX;
    const sourceH = crop.height * scaleY;

    const targetWidth = 1080;
    const targetHeight = 1350;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = new Image();
    img.src = rotatedDataUrl;
    img.onload = () => {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        targetWidth,
        targetHeight
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const croppedFile = new File([blob], cleanName, { type: 'image/jpeg' });
            onApplyCrop(croppedFile);
            onClose();
          }
        },
        'image/jpeg',
        0.94
      );
    };
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                4:5 크롭 영역 직접 지정
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded">
                1080 × 1350 px
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              전체 사진 위에서 4:5 사각형 박스를 자유롭게 이동하고 모서리를 당겨 원하는 부위를 선택하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Crop Stage */}
        <div className="py-2 flex flex-col items-center justify-center overflow-hidden flex-1 min-h-[280px]">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-[52vh] flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden shadow-inner p-1"
          >
            {/* The Full Displayed Image */}
            <img
              ref={imgRef}
              src={rotatedDataUrl}
              alt="전체 시공 사진"
              draggable={false}
              onLoad={updateImageDisplaySize}
              className="max-h-[50vh] max-w-full w-auto h-auto object-contain block pointer-events-none select-none rounded"
            />

            {/* Dark Mask & Crop Frame Container (Exact Match to Displayed Image) */}
            {imgDisplaySize && (
              <div
                style={{
                  width: `${imgDisplaySize.width}px`,
                  height: `${imgDisplaySize.height}px`,
                }}
                className="absolute inset-0 m-auto pointer-events-none"
              >
                {/* 4 Shaded Masks Outside the Crop Box */}
                {/* Top Mask */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${crop.y}px`,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  }}
                />
                {/* Bottom Mask */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${crop.y + crop.height}px`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  }}
                />
                {/* Left Mask */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${crop.y}px`,
                    left: 0,
                    width: `${crop.x}px`,
                    height: `${crop.height}px`,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  }}
                />
                {/* Right Mask */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${crop.y}px`,
                    left: `${crop.x + crop.width}px`,
                    right: 0,
                    height: `${crop.height}px`,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  }}
                />

                {/* The Interactive 4:5 Crop Box */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${crop.x}px`,
                    top: `${crop.y}px`,
                    width: `${crop.width}px`,
                    height: `${crop.height}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleStartDrag('move', e.clientX, e.clientY);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      handleStartDrag('move', e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  className="pointer-events-auto border-2 border-white shadow-2xl cursor-move group"
                >
                  {/* 3x3 Composition Rule-of-Thirds Grid */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-b border-white/40"></div>
                    <div className="border-r border-white/40"></div>
                    <div className="border-r border-white/40"></div>
                    <div></div>
                  </div>

                  {/* Center Drag Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[11px] px-2 py-1 rounded-md flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      <span>이동</span>
                    </span>
                  </div>

                  {/* Corner Handles (Large touch targets for mobile) */}
                  {/* NW Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStartDrag('nw', e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        handleStartDrag('nw', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize shadow-md flex items-center justify-center touch-none"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>

                  {/* NE Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStartDrag('ne', e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        handleStartDrag('ne', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize shadow-md flex items-center justify-center touch-none"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>

                  {/* SW Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStartDrag('sw', e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        handleStartDrag('sw', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize shadow-md flex items-center justify-center touch-none"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>

                  {/* SE Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStartDrag('se', e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        handleStartDrag('se', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize shadow-md flex items-center justify-center touch-none"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>

                  {/* 4:5 Aspect Ratio Tag */}
                  <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
                    4:5
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Position & Adjustment Presets */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-600">빠른 위치 맞춤:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset('max')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
              >
                최대 크기
              </button>
              <button
                type="button"
                onClick={() => handlePreset('top')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                title="상단 커튼박스 / 블라인드 헤드 강조"
              >
                <ArrowUp className="w-3 h-3 text-slate-500" />
                <span>상단 헤드</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset('center')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
              >
                <AlignCenter className="w-3 h-3 text-slate-500" />
                <span>중앙</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset('bottom')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                title="하단 바닥 마감 / 주름 드레이프 강조"
              >
                <ArrowDown className="w-3 h-3 text-slate-500" />
                <span>하단 마감</span>
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors ml-1"
                title="가로/세로 90도 회전"
              >
                <RotateCw className="w-3 h-3 text-slate-500" />
                <span>90° 회전</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>※ 박스 안쪽을 누르고 끌면 <strong>이동</strong>, 모서리 파란 점을 당기면 <strong>크기 조절</strong>됩니다.</span>
            {naturalSize && (
              <span className="font-mono text-slate-600">
                원본 {naturalSize.width}×{naturalSize.height}px
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors min-h-[44px]"
          >
            취소 (원본 유지)
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>선택 영역 4:5로 크롭 적용 (1080 × 1350 px)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
