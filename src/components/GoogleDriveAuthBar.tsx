import React from 'react';
import { User } from 'firebase/auth';
import { HardDrive, ExternalLink, LogOut, CheckCircle2, FolderCog, Folder } from 'lucide-react';

interface GoogleDriveAuthBarProps {
  user: User | null;
  accessToken: string | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  folderId?: string | null;
  folderName?: string | null;
  onOpenFolderSelector: () => void;
}

export const GoogleDriveAuthBar: React.FC<GoogleDriveAuthBarProps> = ({
  user,
  accessToken,
  isLoggingIn,
  onLogin,
  onLogout,
  folderId,
  folderName,
  onOpenFolderSelector,
}) => {
  if (!user || !accessToken) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Google Drive 자동 업로드 연동
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Google 계정으로 로그인하면 n8n 없이도 시공 사진이 내가 지정한 Google Drive 폴더에 규격 파일명으로 즉시 저장됩니다.
            </p>
          </div>

          {/* Official Google Sign-In Styled Button */}
          <button
            type="button"
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[44px] shrink-0"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isLoggingIn ? 'Google 로그인 중...' : 'Sign in with Google (드라이브 연동)'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Google User'}
            className="w-8 h-8 rounded-full border border-emerald-300 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user.email?.charAt(0).toUpperCase() || 'G'}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">Google Drive 연결됨</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1 mt-0.5">
            <span className="truncate max-w-[150px]">{user.email}</span>
            <span className="text-slate-400">·</span>
            <span>저장 위치:</span>
            <strong className="text-emerald-900 bg-emerald-100/80 px-1.5 py-0.2 rounded font-mono truncate max-w-[180px]">
              {folderName || 'Hills Blind Lab (기본)'}
            </strong>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
        <button
          type="button"
          onClick={onOpenFolderSelector}
          title="저장할 폴더 변경"
          className="px-2.5 py-1.5 text-xs text-slate-800 bg-white hover:bg-slate-100 rounded-md border border-slate-300 font-semibold flex items-center gap-1 transition-colors min-h-[34px]"
        >
          <FolderCog className="w-3.5 h-3.5 text-slate-600" />
          <span>폴더 변경</span>
        </button>

        <a
          href={
            folderId
              ? `https://drive.google.com/drive/folders/${folderId}`
              : 'https://drive.google.com/drive/my-drive'
          }
          target="_blank"
          rel="noopener noreferrer"
          title="Google Drive에서 열기"
          className="px-2.5 py-1.5 text-xs text-emerald-800 bg-white hover:bg-emerald-100/60 rounded-md border border-emerald-300 font-semibold flex items-center gap-1 transition-colors min-h-[34px]"
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">드라이브 열기</span>
          <ExternalLink className="w-3 h-3 text-emerald-600" />
        </a>

        <button
          type="button"
          onClick={onLogout}
          title="로그아웃"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="sr-only">연결 해제</span>
        </button>
      </div>
    </div>
  );
};
