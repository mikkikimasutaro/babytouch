export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  
  async initialize() {
    if (this.isInitialized) return;

    try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isInitialized = true;

        await this.audioContext.resume();
        console.log('Audio context initialized & resumed');
    } catch (error) {
        console.warn('Audio context not supported:', error);
    }
  }
 
  async playTone(frequency: number, duration: number) {
    if (!this.audioContext) {
      await this.initialize();
    }
    
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + duration / 1000 - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }
  
  async playChord(baseFrequency: number, duration: number) {
    const frequencies = [
      baseFrequency,
      baseFrequency * 1.25, // 長三度
      baseFrequency * 1.5    // 完全五度
    ];
    
    frequencies.forEach(freq => {
      this.playTone(freq, duration);
    });
  }
}