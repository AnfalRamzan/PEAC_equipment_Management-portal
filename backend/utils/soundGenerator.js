// utils/soundGenerator.js
export const generateNotificationSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create two tones for a pleasant notification
        const notes = [880, 1100];
        notes.forEach((freq, index) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + index * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * 0.15 + 0.2);
            
            oscillator.start(audioCtx.currentTime + index * 0.15);
            oscillator.stop(audioCtx.currentTime + index * 0.15 + 0.2);
        });
    } catch(e) {
        console.log('🔊 Sound not supported');
    }
};