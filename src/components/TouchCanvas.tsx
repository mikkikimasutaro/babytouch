import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AIFeedbackEngine, TouchOperation, FeedbackResponse } from './AIFeedbackEngine';
import { AudioPlayer } from './AudioPlayer';
import { analyzeTouchHistory } from '../firebase';

interface TouchCanvasProps {
  onFeedback?: (feedback: FeedbackResponse) => void;
  onAIMessages?: (message: string) => void;
  userInfo: {
    nickname: string;
    birthMonth: string;
    gender: string;
  };
}

interface TouchEffect {
  id: string;
  x: number;
  y: number;
  color: { r: number; g: number; b: number };
  startTime: number;
  duration: number;
  type: 'ripple' | 'particle' | 'pulse' | 'burst';
}

export function TouchCanvas({ onFeedback, onAIMessages, userInfo }: TouchCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const aiEngine = useRef(new AIFeedbackEngine());
  const audioPlayer = useRef(new AudioPlayer());
  const [backgroundColor, setBackgroundColor] = useState({ r: 135, g: 206, b: 235 });
  const [currentEmotion, setCurrentEmotion] = useState<string>('peaceful');
  const [currentEmotionMessage, setCurrentEmotionMessage] = useState<string>('✨ へいわ');
  const [isInteracting, setIsInteracting] = useState(false);
  const [touchEffects, setTouchEffects] = useState<TouchEffect[]>([]);
  const [touchCountSinceLastAI, setTouchCountSinceLastAI] = useState(0);
  const [lastAITime, setLastAITime] = useState(0);
  const [showEmotionMessage, setShowEmotionMessage] = useState(false);


  const processOperation = useCallback(async (operation: TouchOperation, x: number, y: number) => {
    aiEngine.current.addOperation(operation);
    const feedback = aiEngine.current.analyzeBehavior();
    setBackgroundColor(feedback.color);
    setCurrentEmotion(feedback.emotion);
    addTouchEffect(x, y, feedback);
    await audioPlayer.current.playTone(feedback.frequency, feedback.duration);
    onFeedback?.(feedback);

    if (operation.type === 'drag') return;

    setTouchCountSinceLastAI((count) => {
      const newCount = count + 1;
      if (newCount >= 10) {
        analyzeTouchHistory({
          operations: aiEngine.current.getHistory(),
          nickname: userInfo.nickname,
          birthMonth: userInfo.birthMonth,
          gender: userInfo.gender
        })
          .then((result) => {
            const { emotion, message } = result.data as { emotion: string; message: string };
            console.log("AI Feedback Received:", emotion, message);
            aiEngine.current.setEmotionMode(emotion);
            setCurrentEmotion(emotion);
            setCurrentEmotionMessage(message);
            setLastAITime(Date.now());
            if (onAIMessages) onAIMessages(message);
            setShowEmotionMessage(true);
            setTimeout(() => setShowEmotionMessage(false), 5000);
          })
          .catch((err) => {
            console.warn('AI解析失敗', err);
          });
        return 0;
      }
      return newCount;
    });
  }, [onFeedback, onAIMessages, userInfo]);

  const addTouchEffect = useCallback((x: number, y: number, feedback: FeedbackResponse) => {
    const effectTypes: TouchEffect['type'][] = ['ripple', 'particle', 'pulse', 'burst'];
    const effectType = effectTypes[Math.floor(Math.random() * effectTypes.length)];

    const newEffect: TouchEffect = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      color: feedback.color,
      startTime: Date.now(),
      duration: feedback.duration + 200,
      type: effectType
    };

    setTouchEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setTouchEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
    }, newEffect.duration);
  }, []);

  const handleTouchStart = useCallback(async (e: React.TouchEvent) => {
    e.preventDefault();
    setIsInteracting(true);
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    await processOperation({ x, y, timestamp: Date.now(), type: 'tap' }, x, y);
  }, [processOperation]);

  const handleTouchMove = useCallback(async (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    await processOperation({ x, y, timestamp: Date.now(), type: 'drag' }, x, y);
  }, [processOperation]);

  const handleTouchEnd = useCallback(() => setIsInteracting(false), []);

  const rgbString = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const manualTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsInteracting(true);
      const rect = el.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      processOperation({ x, y, timestamp: Date.now(), type: 'tap' }, x, y);
    };

    const manualMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsInteracting(true);
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      processOperation({ x, y, timestamp: Date.now(), type: 'tap' }, x, y);
    };

    el.addEventListener('touchstart', manualTouchStart, { passive: false });
    el.addEventListener('mousedown', manualMouseDown);

    return () => {
      el.removeEventListener('touchstart', manualTouchStart);
      el.removeEventListener('mousedown', manualMouseDown);
    };
  }, [processOperation]);

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden cursor-none select-none"
      style={{ backgroundColor: rgbString, transition: 'background-color 0.3s ease' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {touchEffects.map(effect => {
        const elapsed = Date.now() - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1);
        const opacity = 1 - progress;
        const scale = 1 + progress * 2;
        const effectColor = `rgba(${effect.color.r}, ${effect.color.g}, ${effect.color.b}, ${opacity})`;

        switch (effect.type) {
          case 'ripple':
            return <div key={effect.id} className="absolute pointer-events-none" style={{ left: effect.x - 25, top: effect.y - 25, width: 50, height: 50, borderRadius: '50%', border: `3px solid ${effectColor}`, transform: `scale(${scale})`, transition: 'none' }} />;
          case 'particle':
            return (
              <div key={effect.id} className="absolute pointer-events-none" style={{ left: effect.x, top: effect.y, transform: `translate(-50%, -50%) scale(${scale})`, transition: 'none' }}>
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 360) / 8;
                  const distance = progress * 40;
                  const particleX = Math.cos((angle * Math.PI) / 180) * distance;
                  const particleY = Math.sin((angle * Math.PI) / 180) * distance;
                  return <div key={i} className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: effectColor, left: particleX, top: particleY, transform: 'translate(-50%, -50%)' }} />;
                })}
              </div>
            );
          case 'pulse':
            return <div key={effect.id} className="absolute pointer-events-none rounded-full" style={{ left: effect.x - 30, top: effect.y - 30, width: 60, height: 60, backgroundColor: effectColor, transform: `scale(${scale})`, transition: 'none' }} />;
          case 'burst':
            return <div key={effect.id} className="absolute pointer-events-none" style={{ left: effect.x - 15, top: effect.y - 15, width: 30, height: 30, borderRadius: '30%', backgroundColor: effectColor, transform: `scale(${scale})`, transition: 'none' }} />;
          default:
            return null;
        }
      })}

      {showEmotionMessage && (
        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white/80">{currentEmotionMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
