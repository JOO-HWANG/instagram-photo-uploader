import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { LocationSelector } from './components/LocationSelector';
import { RoomAndWindowSelector } from './components/RoomAndWindowSelector';
import { ProductSelector } from './components/ProductSelector';
import { AiCaptionBox } from './components/AiCaptionBox';
import { FileNamePreviewCard } from './components/FileNamePreviewCard';
import { WebhookModal } from './components/WebhookModal';
import { UploadHistory } from './components/UploadHistory';
import { GoogleDriveAuthBar } from './components/GoogleDriveAuthBar';
import { DriveFolderSelectorModal } from './components/DriveFolderSelectorModal';
import { cleanText, DEFAULT_N8N_WEBHOOK_URL } from './constants/data';
import { HistoryRecord } from './types';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  uploadPhotoToGoogleDrive,
  getAccessToken,
} from './services/driveService';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  ExternalLink,
  Check,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'uploader' | 'history'>('uploader');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);

  // Google Auth & Drive State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(() => {
    return localStorage.getItem('hills_drive_folder_id');
  });
  const [driveFolderName, setDriveFolderName] = useState<string | null>(() => {
    return localStorage.getItem('hills_drive_folder_name') || 'Hills Blind Lab (기본 폴더)';
  });

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [postcode, setPostcode] = useState('2154');
  const [suburb, setSuburb] = useState('CastleHill');
  const [locationCode, setLocationCode] = useState('L');
  const [windowSeq, setWindowSeq] = useState('1');
  const [productCode, setProductCode] = useState('rbb');
  const [memo, setMemo] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Targets
  const [uploadToDrive, setUploadToDrive] = useState(true);
  const [sendToWebhook, setSendToWebhook] = useState(false);

  // Webhook Configuration
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('hills_n8n_webhook') || DEFAULT_N8N_WEBHOOK_URL;
  });
  const [useProxy, setUseProxy] = useState(() => {
    const saved = localStorage.getItem('hills_use_proxy');
    return saved !== null ? saved === 'true' : true;
  });

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hills_upload_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (loggedInUser, token) => {
        setUser(loggedInUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem('hills_n8n_webhook', webhookUrl);
  }, [webhookUrl]);

  useEffect(() => {
    localStorage.setItem('hills_use_proxy', String(useProxy));
  }, [useProxy]);

  useEffect(() => {
    try {
      localStorage.setItem('hills_upload_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, trimming history thumbnails');
    }
  }, [history]);

  // Google Login / Logout handlers
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setSubmitError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setUploadToDrive(true);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setAccessToken(null);
  };

  const handleSelectFolder = (id: string | null, name: string | null) => {
    setDriveFolderId(id);
    const resolvedName = name || 'Hills Blind Lab (기본 폴더)';
    setDriveFolderName(resolvedName);
    if (id) {
      localStorage.setItem('hills_drive_folder_id', id);
    } else {
      localStorage.removeItem('hills_drive_folder_id');
    }
    localStorage.setItem('hills_drive_folder_name', resolvedName);
  };

  // Standardized Filename Engine
  const { generatedFileName, fullLocation, cleanedSuburb } = useMemo(() => {
    const cleanSub = cleanText(suburb.trim()) || 'Hills';
    const loc = locationCode;
    const seq = windowSeq;
    const prod = productCode;
    const ext = file ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';

    // Format: Suburb_L1_rbb.jpg or Suburb_MB_cts.jpg
    const fullLoc = seq ? `${loc}${seq}` : loc;
    const genName = `${cleanSub}_${fullLoc}_${prod}.${ext}`;

    return {
      generatedFileName: genName,
      fullLocation: fullLoc,
      cleanedSuburb: cleanSub,
    };
  }, [suburb, locationCode, windowSeq, productCode, file]);

  // Handle image selection
  const handleFileSelect = (selectedFile: File) => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFilePreviewUrl(url);
    setSubmitSuccess(null);
    setSubmitError(null);
    setLastUploadedLink(null);
  };

  const handleClearFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFile(null);
    setFilePreviewUrl(null);
  };

  // Convert image to base64 for webhook
  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  // On successful manual photo download
  const handleDownloadDone = () => {
    const newRecord: HistoryRecord = {
      id: `hist_${Date.now()}`,
      timestamp: Date.now(),
      fileName: generatedFileName,
      suburb: cleanedSuburb,
      postcode,
      locationFull: fullLocation,
      productCode,
      memo,
      filePreviewUrl: filePreviewUrl || undefined,
      fileSize: file?.size,
      webhookStatus: 'downloaded-only',
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  // Submit Handler: Upload to Google Drive and/or Webhook
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setSubmitError('시공 사진을 먼저 촬영하거나 선택해 주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If uploading to Drive is selected but user is not logged in, prompt sign-in
    let currentToken = accessToken;
    if (uploadToDrive && (!user || !currentToken)) {
      try {
        setIsLoggingIn(true);
        const signResult = await googleSignIn();
        if (signResult) {
          setUser(signResult.user);
          setAccessToken(signResult.accessToken);
          currentToken = signResult.accessToken;
        } else {
          return;
        }
      } catch (authErr: any) {
        setSubmitError(`Google 계정 연결 실패: ${authErr.message}`);
        setIsLoggingIn(false);
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    setLastUploadedLink(null);

    let driveUploaded = false;
    let driveFileLink: string | undefined;
    let driveId: string | undefined;

    try {
      // 1. Upload to Google Drive (User requested: "google my drive에 이대로 이름 변경해서 올려주면 좋겠어")
      if (uploadToDrive && currentToken) {
        const driveResult = await uploadPhotoToGoogleDrive(
          currentToken,
          file,
          generatedFileName,
          {
            description: `Hills Blind Lab Installation Photo\nSuburb: ${cleanedSuburb} (${postcode})\nLocation: ${fullLocation}\nProduct: ${productCode}\nNotes: ${memo}\nCaption: ${aiCaption}`,
            folderId: driveFolderId || undefined,
          }
        );

        driveUploaded = true;
        driveFileLink = driveResult.webViewLink;
        driveId = driveResult.id;
        setLastUploadedLink(driveResult.webViewLink || null);
      }

      // 2. Optional: Send to n8n Webhook if enabled
      let webhookSuccess = false;
      if (sendToWebhook) {
        const base64Data = await fileToBase64(file);
        const payload = {
          event: 'hills_blind_post_upload',
          timestamp: new Date().toISOString(),
          fileName: generatedFileName,
          postcode: postcode.trim(),
          suburb: cleanedSuburb,
          locationRaw: locationCode,
          windowSeq,
          locationFull: fullLocation,
          productCode,
          memo: memo.trim(),
          aiCaption: aiCaption.trim(),
          hashtags,
          driveLink: driveFileLink || null,
          imageMeta: {
            originalName: file.name,
            size: file.size,
            type: file.type,
          },
          imageBase64: base64Data,
        };

        if (useProxy) {
          const res = await fetch('/api/webhook-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhookUrl, payload }),
          });
          const data = await res.json();
          if (res.ok && data.success) webhookSuccess = true;
        } else {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) webhookSuccess = true;
        }
      }

      // 3. Add to History
      const newRecord: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: Date.now(),
        fileName: generatedFileName,
        suburb: cleanedSuburb,
        postcode,
        locationFull: fullLocation,
        productCode,
        memo,
        filePreviewUrl: filePreviewUrl || undefined,
        fileSize: file.size,
        aiCaption,
        driveStatus: driveUploaded ? 'success' : undefined,
        driveFileId: driveId,
        driveWebViewLink: driveFileLink,
        webhookStatus: sendToWebhook ? (webhookSuccess ? 'success' : 'failed') : undefined,
      };
      setHistory((prev) => [newRecord, ...prev]);

      if (driveUploaded) {
        setSubmitSuccess(
          `Google Drive 업로드 완료! '${generatedFileName}' 파일이 내 드라이브 '${driveFolderName || 'Hills Blind Lab'}' 폴더에 성공적으로 저장되었습니다.`
        );
      } else if (webhookSuccess) {
        setSubmitSuccess(`전송 완료! '${generatedFileName}' 포스팅 자동화로 전달되었습니다.`);
      } else {
        setSubmitSuccess(`'${generatedFileName}' 처리가 완료되었습니다.`);
      }

      // Advance windowSeq clockwise automatically for rapid next window recording!
      if (windowSeq) {
        const nextSeq = String(parseInt(windowSeq, 10) + 1);
        setWindowSeq(nextSeq);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(
        `업로드 오류: ${err.message}. Google 계정 권한을 확인하거나, '사진 다운로드' 버튼으로 기기에 직접 저장할 수 있습니다.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {/* Tab 1: Main Uploader Form */}
        {activeTab === 'uploader' && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Banner info */}
            <div className="text-center pb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                📸 Hills Blind Lab 현장 업로드
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                규격 파일명 자동 생성 &middot; Google Drive 클라우드 저장 &middot; AI 인스타 캡션
              </p>
            </div>

            {/* Google Drive Auth & Status Bar */}
            <GoogleDriveAuthBar
              user={user}
              accessToken={accessToken}
              isLoggingIn={isLoggingIn}
              onLogin={handleLogin}
              onLogout={handleLogout}
              folderId={driveFolderId}
              folderName={driveFolderName}
              onOpenFolderSelector={() => setIsFolderSelectorOpen(true)}
            />

            {/* Notification Alerts */}
            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex flex-col gap-2 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">업로드 성공!</div>
                    <div className="mt-0.5 leading-relaxed">{submitSuccess}</div>
                  </div>
                </div>

                {lastUploadedLink && (
                  <div className="pt-2 pl-7.5 flex items-center gap-2">
                    <a
                      href={lastUploadedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Google Drive에서 파일 바로 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs sm:text-sm flex flex-col gap-2 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">업로드 안내</div>
                    <div className="mt-0.5 leading-relaxed">{submitError}</div>
                  </div>
                </div>
                {(submitError.includes('권한') || submitError.includes('scope') || submitError.includes('로그인')) && (
                  <div className="pl-8 pt-1">
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Google 계정 다시 로그인 및 권한 승인</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Photo selection */}
            <ImageUploader
              file={file}
              previewUrl={filePreviewUrl}
              onFileSelect={handleFileSelect}
              onClear={handleClearFile}
            />

            {/* Step 2: Postcode & Suburb */}
            <LocationSelector
              postcode={postcode}
              suburb={suburb}
              onChangePostcode={setPostcode}
              onChangeSuburb={setSuburb}
            />

            {/* Step 3: Location and Clockwise Window */}
            <RoomAndWindowSelector
              locationCode={locationCode}
              windowSeq={windowSeq}
              onChangeLocation={setLocationCode}
              onChangeWindowSeq={setWindowSeq}
            />

            {/* Step 4: Product */}
            <ProductSelector
              productCode={productCode}
              onChangeProduct={setProductCode}
            />

            {/* Step 5: Field Notes & AI Caption Generator */}
            <AiCaptionBox
              memo={memo}
              onChangeMemo={setMemo}
              aiCaption={aiCaption}
              onChangeAiCaption={setAiCaption}
              hashtags={hashtags}
              suburb={cleanedSuburb}
              locationName={fullLocation}
              productName={productCode}
              imageBase64={filePreviewUrl}
              onCaptionGenerated={(caption, tags) => {
                setAiCaption(caption);
                setHashtags(tags);
              }}
            />

            {/* Standardized Filename Preview & Direct Download */}
            <FileNamePreviewCard
              fileName={generatedFileName}
              suburb={cleanedSuburb}
              fullLocation={fullLocation}
              productCode={productCode}
              file={file}
              onDownloadDone={handleDownloadDone}
            />

            {/* Storage Destinations Toggles */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>전송 대상 선택</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (Google Drive 바로 저장 권장)
                </span>
              </div>

              <div className="space-y-2">
                {/* Google Drive Option */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        내 Google Drive로 직접 업로드
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {user ? `${user.email} (Hills Blind Lab 폴더)` : '전송 시 Google 로그인 후 자동 저장'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={uploadToDrive}
                    onChange={(e) => setUploadToDrive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>

                {/* Optional Webhook Option */}
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        n8n / 인스타그램 웹훅 동시 전송
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[240px]">
                        {sendToWebhook ? webhookUrl : '현재 비활성화 (n8n 사용 시 켜기)'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendToWebhook}
                    onChange={(e) => setSendToWebhook(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoggingIn}
                className="w-full min-h-[54px] px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting || isLoggingIn ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>
                      {isLoggingIn
                        ? 'Google 로그인 진행 중...'
                        : 'Google Drive로 사진 업로드 중...'}
                    </span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                    <span>Google Drive에 파일명 적용하여 저장하기</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-500 mt-2">
                시공 사진이 <code className="font-mono font-bold text-blue-600">{generatedFileName}</code> 으로 자동 저장됩니다.
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Upload History */}
        {activeTab === 'history' && (
          <UploadHistory
            history={history}
            onClearHistory={() => setHistory([])}
            onBackToUpload={() => setActiveTab('uploader')}
          />
        )}
      </main>

      {/* Webhook Configuration Modal */}
      <WebhookModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        webhookUrl={webhookUrl}
        onSaveWebhookUrl={setWebhookUrl}
        useProxy={useProxy}
        onToggleProxy={setUseProxy}
      />

      {/* Google Drive Folder Selector Modal */}
      <DriveFolderSelectorModal
        isOpen={isFolderSelectorOpen}
        onClose={() => setIsFolderSelectorOpen(false)}
        accessToken={accessToken}
        currentFolderId={driveFolderId}
        currentFolderName={driveFolderName}
        onSelectFolder={handleSelectFolder}
      />
    </div>
  );
}
