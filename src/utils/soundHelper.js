// Utility to play popup sound effect for Order Confirmation & Service Request Confirmation
export const playSuccessSound = () => {
    try {
        // Try playing custom audio file if provided in public/sounds/success.mp3
        const audio = new Audio('/sounds/success.mp3');
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                // If audio file fails or doesn't exist, use Web Audio API synthesized success chime fallback
                playWebAudioChime();
            });
        }
    } catch (e) {
        playWebAudioChime();
    }
};

// Web Audio API Synthesizer (Instant crisp success chime sound: C5 -> G5 -> C6 notes)
const playWebAudioChime = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const notes = [
            { freq: 523.25, time: 0, duration: 0.15 },    // C5
            { freq: 659.25, time: 0.08, duration: 0.15 }, // E5
            { freq: 783.99, time: 0.16, duration: 0.18 }, // G5
            { freq: 1046.50, time: 0.24, duration: 0.35 } // C6
        ];

        notes.forEach(({ freq, time, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + time);

            gain.gain.setValueAtTime(0, now + time);
            gain.gain.linearRampToValueAtTime(0.3, now + time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + time);
            osc.stop(now + time + duration);
        });
    } catch (e) {
        console.warn('Web Audio playback failed:', e);
    }
};
