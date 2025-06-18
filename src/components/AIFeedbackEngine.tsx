export interface TouchOperation {
  x: number;
  y: number;
  timestamp: number;
  type: 'tap' | 'drag' | 'hold';
  duration?: number;
  velocity?: number;
}

export interface FeedbackResponse {
  color: { r: number; g: number; b: number };
  frequency: number; // Hz
  duration: number; // ms
  emotion: string;
}

export class AIFeedbackEngine {
  private operationHistory: TouchOperation[] = [];
  private emotionMode: string = 'default';

  addOperation(operation: TouchOperation) {
    this.operationHistory.push(operation);
    if (this.operationHistory.length > 20) {
      this.operationHistory.shift();
    }
  }

  getHistory(): TouchOperation[] {
    return [...this.operationHistory];
  }

  setEmotionMode(emotion: string) {
    this.emotionMode = emotion;
  }

  analyzeBehavior(): FeedbackResponse {
    if (this.emotionMode !== 'default') {
      return this.getEmotionBasedFeedback(this.emotionMode);
    }

    const recent = this.operationHistory.slice(-5);
    if (recent.length === 0) return this.getRandomJoyfulFeedback();

    const avgX = recent.reduce((sum, op) => sum + op.x, 0) / recent.length;
    const avgY = recent.reduce((sum, op) => sum + op.y, 0) / recent.length;
    const tapCount = recent.filter(op => op.type === 'tap').length;
    const dragCount = recent.filter(op => op.type === 'drag').length;
    const holdCount = recent.filter(op => op.type === 'hold').length;

    if (tapCount >= 3) return this.getExcitedFeedback(avgX, avgY);
    if (dragCount >= 2) return this.getExplorativeFeedback(avgX, avgY);
    if (holdCount >= 1) return this.getCalmFeedback(avgX, avgY);
    return this.getCuriousFeedback(avgX, avgY);
  }

  private getEmotionBasedFeedback(emotion: string): FeedbackResponse {
    switch (emotion) {
      case 'joyful':
        return { color: { r: 255, g: 223, b: 0 }, frequency: 523, duration: 400, emotion };
      case 'excited':
        return { color: { r: 255, g: 105, b: 180 }, frequency: 659, duration: 300, emotion };
      case 'calm':
        return { color: { r: 135, g: 206, b: 250 }, frequency: 220, duration: 800, emotion };
      case 'curious':
        return { color: { r: 200, g: 160, b: 255 }, frequency: 392, duration: 400, emotion };
      case 'surprised':
        return { color: { r: 255, g: 255, b: 0 }, frequency: 784, duration: 200, emotion };
      case 'explorative':
        return { color: { r: 100, g: 255, b: 200 }, frequency: 349, duration: 500, emotion };
      default:
        return { color: { r: 200, g: 200, b: 255 }, frequency: 440, duration: 400, emotion: 'unknown' };
    }
  }

  private getExcitedFeedback(x: number, y: number): FeedbackResponse {
    return {
      color: {
        r: Math.floor(255 * (x / window.innerWidth)),
        g: Math.floor(150 + 105 * (y / window.innerHeight)),
        b: Math.floor(100 + 155 * Math.random())
      },
      frequency: 440 + (x / window.innerWidth) * 220,
      duration: 300,
      emotion: 'excited'
    };
  }

  private getExplorativeFeedback(x: number, y: number): FeedbackResponse {
    return {
      color: {
        r: Math.floor(100 + 100 * (x / window.innerWidth)),
        g: Math.floor(200 + 55 * (y / window.innerHeight)),
        b: Math.floor(150 + 105 * (1 - y / window.innerHeight))
      },
      frequency: 330 + (y / window.innerHeight) * 110,
      duration: 500,
      emotion: 'explorative'
    };
  }

  private getCalmFeedback(x: number, y: number): FeedbackResponse {
    return {
      color: {
        r: Math.floor(150 + 50 * Math.sin(Date.now() / 1000)),
        g: Math.floor(200 + 55 * Math.cos(Date.now() / 1500)),
        b: Math.floor(180 + 75 * Math.sin(Date.now() / 2000))
      },
      frequency: 220 + Math.sin(Date.now() / 1000) * 55,
      duration: 800,
      emotion: 'calm'
    };
  }

  private getCuriousFeedback(x: number, y: number): FeedbackResponse {
    const hue = (x / window.innerWidth) * 360;
    const [r, g, b] = this.hslToRgb(hue, 0.7, 0.6);
    return {
      color: { r: Math.floor(r), g: Math.floor(g), b: Math.floor(b) },
      frequency: 392 + (x / window.innerWidth) * 98,
      duration: 400,
      emotion: 'curious'
    };
  }

  private getRandomJoyfulFeedback(): FeedbackResponse {
    const colors = [
      { r: 255, g: 192, b: 203 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 165, b: 0 },
      { r: 144, g: 238, b: 144 }
    ];
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      duration: 350,
      emotion: 'joyful'
    };
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
}
