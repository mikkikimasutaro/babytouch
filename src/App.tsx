import React, { useState } from 'react';
import { TouchCanvas } from './components/TouchCanvas';
import { FeedbackResponse } from './components/AIFeedbackEngine';
import './App.css';

export default function App() {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackResponse[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [birthMonth, setBirthMonth] = useState(() => localStorage.getItem('birthMonth') || '');
  const [gender, setGender] = useState(() => localStorage.getItem('gender') || '');
  const [showForm, setShowForm] = useState(false);
  const [aiMessage, setAiMessages] = useState<string[]>([]);

  const handleAIMessages = (message: string) => {
    setAiMessages(prev => [...prev.slice(-9), message]);
  };

  const handleFeedback = (feedback: FeedbackResponse) => {
    setFeedbackHistory(prev => [...prev.slice(-9), feedback]);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const saveUserInfo = (name: string, month: string, gen: string) => {
    localStorage.setItem('nickname', name);
    localStorage.setItem('birthMonth', month);
    localStorage.setItem('gender', gen);
    setNickname(name);
    setBirthMonth(month);
    setGender(gen);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <TouchCanvas 
        onFeedback={handleFeedback} 
        userInfo={{ nickname, birthMonth, gender }} 
        onAIMessages={handleAIMessages}
      />

      <button
        onClick={toggleDebugInfo}
        className="fixed top-4 right-4 z-50 bg-black/20 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm"
        style={{ fontSize: '12px' }}
      >
        ?
      </button>

      <button
        onClick={() => setShowForm(!showForm)}
        className="fixed top-4 right-12 z-50 text-white bg-black/40 px-3 py-1 rounded"
      >
        ☰
      </button>

      {showForm && (
        <div className="fixed top-16 right-12 bg-white p-4 rounded shadow z-50 w-64">
          <h2 className="text-sm font-bold mb-2">お子さまの情報</h2>
          <p className="text-xs text-gray-600 mb-2">※個人を特定しない範囲で入力してください</p>
          <input
            className="w-full border p-1 mb-2 text-sm"
            placeholder="ニックネーム"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <input
            className="w-full border p-1 mb-2 text-sm"
            placeholder="誕生年月 (例: 2024-01)"
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value)}
          />
          <select
            className="w-full border p-1 mb-2 text-sm"
            value={gender}
            onChange={e => setGender(e.target.value)}
          >
            <option value="">性別を選択</option>
            <option value="boy">男の子</option>
            <option value="girl">女の子</option>
            <option value="other">その他</option>
          </select>
          <button
            className="w-full bg-blue-500 text-white py-1 rounded text-sm"
            onClick={() => {
              saveUserInfo(nickname, birthMonth, gender);
              setShowForm(false);
            }}
          >保存する</button>
        </div>
      )}

      {showDebugInfo && (
        <div className="fixed top-16 right-4 z-50 bg-black/60 text-white rounded-lg p-4 max-w-xs backdrop-blur-sm">
          <h3 className="mb-2">このアプリについて</h3>
          <div className="mt-4 text-xs text-white/70">
            <p>赤ちゃんが画面をタッチしたりなぞったりすると音とエフェクトで反応します。</p>
            <p>ご両親と赤ちゃんのコミュニケーションをサポートするAIが、赤ちゃんの操作を分析して、操作に対するフィードバックと感情の推定を言葉にして返します。</p>
          </div>
          <h3 className="mb-2">AIメッセージ履歴</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
          {aiMessage.length > 0 && (
            <div className="mt-2 text-xs text-yellow-200 space-y-1">
              {aiMessage.map((msg, i) => (
                <div key={i} className="break-words leading-snug">
                  • {msg}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      <div className="sr-only">
        赤ちゃん向けフィードバックアプリ。画面をタッチすると色と音で反応します。
        タッチの仕方によって異なる反応が返されます。
      </div>
    </div>
  );
}
