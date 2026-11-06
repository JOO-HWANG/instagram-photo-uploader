import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, RefreshCw, Link2, ShieldCheck } from 'lucide-react';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  useProxy: boolean;
  onToggleProxy: (val: boolean) => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  onSaveWebhookUrl,
  useProxy,
  onToggleProxy,
}) => {
  const [urlInput, setUrlInput] = useState(webhookUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveWebhookUrl(urlInput.trim());
    onClose();
  };

  const handleTestPing = async () => {
    if (!urlInput.trim()) {
      setTestStatus('error');
      setTestMessage('웹훅 URL을 입력해주세요.');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);

    const testPayload = {
      event: 'ping_test',
      source: 'Hills Blind Lab Uploader',
      timestamp: new Date().toISOString(),
      testMessage: 'Hills Blind Lab connection test',
    };

    try {
      if (useProxy) {
        // Use server-side proxy
        const res = await fetch('/api/webhook-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: urlInput.trim(),
            payload: testPayload,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setTestStatus('success');
          setTestMessage(`연결 성공! (HTTP ${data.status} ${data.statusText || 'OK'})`);
        } else {
          setTestStatus('error');
          setTestMessage(data.error || `연결 실패 (HTTP ${data.status})`);
        }
      } else {
        // Direct browser fetch
        const res = await fetch(urlInput.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
        });

        if (res.ok) {
          setTestStatus('success');
          setTestMessage(`연결 성공! (HTTP ${res.status})`);
        } else {
          setTestStatus('error');
          setTestMessage(`웹훅 응답 코드: ${res.status}`);
        }
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(
        useProxy
          ? `서버 통신 실패: ${err.message}`
          : `브라우저 CORS 차단 또는 도메인 오류: ${err.message}. '서버 중계(CORS 해결)' 모드를 권장합니다.`
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">n8n / 인스타그램 웹훅 설정</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              n8n Webhook URL (POST Endpoint)
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://n8n.your-domain.com/webhook/upload-post"
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              n8n 워크플로우의 Webhook 트리거 노드에서 발급받은 Production 또는 Test URL을 입력합니다.
            </p>
          </div>

          {/* CORS Proxy Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">서버 프록시 중계 (CORS 차단 방지)</div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  브라우저의 Cross-Origin 제한 없이 n8n 웹훅으로 안전하게 전송합니다.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => onToggleProxy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Test Status feedback */}
          {testStatus === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-tight">{testMessage}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <button
            type="button"
            onClick={handleTestPing}
            disabled={testStatus === 'testing'}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[40px]"
          >
            {testStatus === 'testing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>연결 테스트 중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>연결 테스트</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors min-h-[40px]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors min-h-[40px]"
            >
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
