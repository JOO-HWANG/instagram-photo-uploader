import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, Link, Check, ExternalLink, X, HelpCircle, HardDrive, RefreshCw } from 'lucide-react';

interface DriveFolderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentFolderId: string | null;
  currentFolderName: string | null;
  onSelectFolder: (folderId: string | null, folderName: string | null) => void;
}

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export const DriveFolderSelectorModal: React.FC<DriveFolderSelectorModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  currentFolderId,
  currentFolderName,
  onSelectFolder,
}) => {
  const [folderInput, setFolderInput] = useState('');
  const [folderNickName, setFolderNickName] = useState('');
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderInput(currentFolderId ? `https://drive.google.com/drive/folders/${currentFolderId}` : '');
      setFolderNickName(currentFolderName || '');
      setPickerError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, currentFolderId, currentFolderName]);

  if (!isOpen) return null;

  // Extracts Google Drive Folder ID from a URL or raw ID string
  const extractFolderId = (input: string): string => {
    const trimmed = input.trim();
    // Matches https://drive.google.com/drive/folders/FOLDER_ID or /u/0/folders/FOLDER_ID
    const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // If user pasted just the ID string directly
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  };

  const handleApplyLink = async () => {
    const extractedId = extractFolderId(folderInput);
    if (!extractedId) {
      setPickerError('올바른 Google Drive 폴더 링크 또는 폴더 ID를 입력해주세요.');
      return;
    }

    setPickerError(null);
    let resolvedName = folderNickName.trim();

    // Attempt to fetch actual folder name if token available
    if (accessToken && !resolvedName) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${extractedId}?fields=id,name`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            resolvedName = data.name;
          }
        }
      } catch (e) {
        // Fallback to generic name if direct metadata query fails due to scope
      }
    }

    const finalName = resolvedName || '지정된 Google Drive 폴더';
    onSelectFolder(extractedId, finalName);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleResetToDefault = () => {
    onSelectFolder(null, 'Hills Blind Lab (기본 폴더)');
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Google Picker Launcher
  const handleOpenGooglePicker = () => {
    if (!accessToken) {
      setPickerError('먼저 Google 계정에 로그인되어 있어야 합니다.');
      return;
    }

    setIsPickerLoading(true);
    setPickerError(null);

    const loadPickerScript = () => {
      if (window.gapi && window.google?.picker) {
        buildPicker();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', {
          callback: () => {
            buildPicker();
          },
        });
      };
      script.onerror = () => {
        setIsPickerLoading(false);
        setPickerError(
          'Google 드라이브 선택기 로드에 실패했습니다. 아래 [폴더 링크 붙여넣기] 방식을 사용해주세요.'
        );
      };
      document.body.appendChild(script);
    };

    const buildPicker = () => {
      try {
        const pickerOrigin =
          window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
            ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
            : window.location.origin;

        const docsView = new window.google.picker.DocsView()
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true)
          .setMimeTypes('application/vnd.google-apps.folder');

        const picker = new window.google.picker.PickerBuilder()
          .addView(docsView)
          .setOAuthToken(accessToken)
          .setOrigin(pickerOrigin)
          .setTitle('시공 사진을 저장할 Google Drive 폴더를 선택하세요')
          .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              if (doc) {
                const pickedId = doc.id;
                const pickedName = doc.name || '선택한 폴더';
                onSelectFolder(pickedId, pickedName);
                onClose();
              }
            }
            if (data.action === window.google.picker.Action.CANCEL) {
              setIsPickerLoading(false);
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err: any) {
        console.error('Picker build error:', err);
        setPickerError(
          '브라우저 보안 설정으로 드라이브 팝업이 차단되었을 수 있습니다. 아래 [폴더 링크 복사/붙여넣기] 방식을 이용하시면 100% 정상 작동합니다.'
        );
      } finally {
        setIsPickerLoading(false);
      }
    };

    loadPickerScript();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Google Drive 저장 폴더 선택
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Selected Folder info */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">현재 설정된 저장 위치:</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-slate-900">
              <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{currentFolderName || 'Hills Blind Lab (기본 자동생성)'}</span>
            </div>
            {currentFolderId && (
              <a
                href={`https://drive.google.com/drive/folders/${currentFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 hover:underline flex items-center gap-1 shrink-0 font-medium"
              >
                <span>드라이브에서 확인</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Method 1: Google Picker Button */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800">
            방법 1. Google Drive 폴더 브라우저로 직접 선택
          </div>
          <button
            type="button"
            onClick={handleOpenGooglePicker}
            disabled={isPickerLoading || !accessToken}
            className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px] disabled:opacity-50"
          >
            {isPickerLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Google Drive 탐색기 로딩 중...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>내 Google Drive에서 폴더 찾아 선택하기</span>
              </>
            )}
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium uppercase">또는 링크로 지정</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Method 2: Paste Folder URL / ID */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-800">
            방법 2. 이미 만든 폴더의 링크 복사 & 붙여넣기 (가장 확실함)
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Google Drive 폴더 링크 또는 폴더 ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1abc... 또는 폴더ID"
                className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              폴더 이름 / 별칭 (선택 사항)
            </label>
            <input
              type="text"
              value={folderNickName}
              onChange={(e) => setFolderNickName(e.target.value)}
              placeholder="예: 힐스 시공 현장 사진 2026"
              className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Quick Help Guide */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-blue-900 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>폴더 링크 복사 방법:</span>
            </div>
            <p>1. Google Drive에서 이미 만들어 두신 폴더를 엽니다.</p>
            <p>2. 브라우저 주소창의 URL(주소)을 복사하거나, 폴더 이름 옆 메뉴에서 [링크 복사]를 누릅니다.</p>
            <p>3. 위 입력창에 붙여넣고 [폴더 설정 적용]을 누르면 완료됩니다.</p>
          </div>
        </div>

        {/* Error / Success message */}
        {pickerError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            {pickerError}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>저장 위치가 성공적으로 설정되었습니다!</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-800 underline py-2 min-h-[38px]"
          >
            기본 자동생성 폴더로 초기화
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors min-h-[40px]"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleApplyLink}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors min-h-[40px]"
            >
              폴더 설정 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
