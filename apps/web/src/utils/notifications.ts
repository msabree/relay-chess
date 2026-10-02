// Modern notification system for chess moves
// Uses Browser Notification API and Web Audio API

let audioContext: AudioContext | null = null;
let moveSoundBuffer: AudioBuffer | null = null;

// Initialize audio context (lazy loading)
const initAudio = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Create a pleasant move notification sound
    if (!moveSoundBuffer && audioContext.state !== 'closed') {
      const sampleRate = audioContext.sampleRate;
      const duration = 0.15; // 150ms
      const frequency = 800; // Hz
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Create a pleasant chime-like sound
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 8) * 0.3;
      }
      
      moveSoundBuffer = buffer;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Audio initialization failed:', error);
    }
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Play move notification sound
export const playMoveSound = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    await initAudio();
    
    if (audioContext && moveSoundBuffer && audioContext.state !== 'closed') {
      const source = audioContext.createBufferSource();
      source.buffer = moveSoundBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sound playback failed:', error);
    }
  }
};

// Show browser notification for move
export const notifyMove = async (title: string, body: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission && document.hidden) {
    // Only show browser notification if tab is not visible
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'chess-move', // Replace previous notifications
        requireInteraction: false,
      });
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        notification.close();
      }, 3000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Notification failed:', error);
      }
    }
  }
  
  // Always play sound if tab is visible
  if (!document.hidden) {
    await playMoveSound();
  }
};

