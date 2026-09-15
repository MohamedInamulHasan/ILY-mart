// Utility to play popup sound effect for Order Confirmation & Service Request Confirmation

let cachedAudio = null;

// Pre-unlock / Pre-load audio on user gesture (e.g., when clicking Confirm button)
export const unlockAudio = () => {
    try {
        if (!cachedAudio) {
            cachedAudio = new Audio('/sounds/success.mp3');
        }
        cachedAudio.volume = 0.01;
        const p = cachedAudio.play();
        if (p !== undefined) {
            p.then(() => {
                if (cachedAudio) {
                    cachedAudio.pause();
                    cachedAudio.currentTime = 0;
                    cachedAudio.volume = 1.0;
                }
            }).catch(() => {});
        }
    } catch (e) {}
};

export const playSuccessSound = () => {
    try {
        const audio = cachedAudio || new Audio('/sounds/success.mp3');
        audio.volume = 1.0;
        audio.currentTime = 0;

        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.warn('Audio element play failed, using Web Audio chime:', err);
                playWebAudioChime();
            });
        }
    } catch (e) {
        playWebAudioChime();
    }
};

// Web Audio API Synthesizer (Instant crisp success chime sound: C5 -> E5 -> G5 -> C6 notes)
export const playWebAudioChime = () => {
    try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return;

        const ctx = new AudioCtxClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

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
            gain.gain.linearRampToValueAtTime(0.4, now + time + 0.02);
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
