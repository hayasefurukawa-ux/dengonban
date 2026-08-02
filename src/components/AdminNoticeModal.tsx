import React, { useState } from 'react';
import { AdminNotice } from '../types';
import { X, Shield, Check } from 'lucide-react';

interface AdminNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminNotice: AdminNotice;
  onSaveAdminNotice: (newNotice: string, updatedBy: string) => Promise<void>;
}

export const AdminNoticeModal: React.FC<AdminNoticeModalProps> = ({
  isOpen,
  onClose,
  adminNotice,
  onSaveAdminNotice,
}) => {
  const [noticeContent, setNoticeContent] = useState<string>(adminNotice.content);
  const [updatedBy, setUpdatedBy] = useState<string>(adminNotice.updatedBy || '中央駅 駅長');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeContent.trim()) return;

    try {
      setIsSubmitting(true);
      await onSaveAdminNotice(noticeContent.trim(), updatedBy.trim() || '駅長（管理人）');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-emerald-600 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-950 border-b border-emerald-800">
          <div className="flex items-center gap-2 font-bold text-base text-amber-300 font-station-sign">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>【管理人専用】管理人の一言を更新</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-emerald-950/60 p-3 rounded-lg border border-emerald-700/50 text-xs text-emerald-200">
            ※このコーナーは駅長・管理人だけがメッセージを更新できます。伝言板の最上部に常時掲示されます。
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              管理人の職名・お名前:
            </label>
            <input
              type="text"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="例: 中央駅 駅長"
              maxLength={25}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              管理人の一言（メッセージ本文）:
            </label>
            <textarea
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              placeholder="例: 台風のため一部ダイヤに遅れが出ております。伝言板は綺麗に使用しましょう。"
              rows={3}
              maxLength={150}
              className="w-full bg-chalkboard chalkboard-bg font-chalk text-base p-3 rounded-lg text-amber-200 border border-emerald-700 focus:border-amber-400 focus:outline-none resize-none"
              required
            />
            <div className="text-right text-[11px] text-stone-500 mt-1">
              {noticeContent.length} / 150文字
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>一言を更新して掲示</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
