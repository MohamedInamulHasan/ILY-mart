// Utility to play popup sound effect for Order Confirmation & Service Request Confirmation
import successSound from '../assets/sounds/success.mp3';

// ----- Notification SFX: drop MP3 files in public/sounds/ -----
// Expected filenames: order_placed.mp3, order_accepted.mp3, order_delivered.mp3, order_cancelled.mp3
const SFX = {
    order_placed:    '/sounds/order_placed.mp3',
    order_accepted:  '/sounds/order_accepted.mp3',
    order_delivered: '/sounds/order_delivered.mp3',
    order_cancelled: '/sounds/order_cancelled.mp3',
};

// Generic helper: play an MP3 from /public/sounds/, fallback to synth chime
const playNotificationSFX = (key, fallbackFn) => {
    try {
        const src = SFX[key];
        if (!src) { fallbackFn && fallbackFn(); return; }
        const audio = new Audio(src);
        audio.volume = 1.0;
        const p = audio.play();
        if (p !== undefined) {
            p.catch(() => { fallbackFn && fallbackFn(); });
        }
    } catch (e) {
        fallbackFn && fallbackFn();
    }
};

export const playOrderPlacedSound = () => playNotificationSFX('order_placed', playWebAudioChime);
export const playOrderAcceptedSound = () => playNotificationSFX('order_accepted', playWebAudioOrderAccepted);
export const playOrderDeliveredSound = () => playNotificationSFX('order_delivered', playWebAudioOrderDelivered);
export const playOrderCancelledSound = () => playNotificationSFX('order_cancelled', playWebAudioOrderCancelled);

let cachedAudio = null;

const getAudioSource = () => {
    return successSound || '/sounds/success.mp3';
};

// Pre-unlock / Pre-load audio on user gesture (e.g., first tap or click anywhere on app)
export const unlockAudio = () => {
    try {
        if (!cachedAudio) {
            cachedAudio = new Audio(getAudioSource());
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

// Automatically attach unlock listener to first tap/click on website
if (typeof window !== 'undefined') {
    const handleFirstUserInteraction = () => {
        unlockAudio();
        window.removeEventListener('click', handleFirstUserInteraction);
        window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
    window.addEventListener('click', handleFirstUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { passive: true, once: true });
}

export const playSuccessSound = () => {
    try {
        const audio = cachedAudio || new Audio(getAudioSource());
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

let incomingOrderInterval = null;
let activeAudioCtx = null;

// Urgent repeating chime alert for incoming orders (Porter / Swiggy / Zomato merchant style)
export const startIncomingOrderAlertSound = () => {
    stopIncomingOrderAlertSound();

    const playToneBurst = () => {
        try {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtxClass) return;

            if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
                activeAudioCtx = new AudioCtxClass();
            }
            if (activeAudioCtx.state === 'suspended') {
                activeAudioCtx.resume();
            }

            const ctx = activeAudioCtx;
            const now = ctx.currentTime;

            // Melodic Porter/Zomato style attention chime (A5 -> D6 -> A5 -> E6)
            const pattern = [
                { freq: 880, time: 0, duration: 0.12 },
                { freq: 1174.66, time: 0.14, duration: 0.20 },
                { freq: 880, time: 0.38, duration: 0.12 },
                { freq: 1318.51, time: 0.52, duration: 0.30 }
            ];

            pattern.forEach(({ freq, time, duration }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle'; // Rich, crisp bell timbre
                osc.frequency.setValueAtTime(freq, now + time);

                gain.gain.setValueAtTime(0, now + time);
                gain.gain.linearRampToValueAtTime(0.5, now + time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + time);
                osc.stop(now + time + duration);
            });

            // Vibrate device (if mobile)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([250, 100, 250, 100, 400]);
            }
        } catch (e) {
            console.warn('Incoming order sound error:', e);
        }
    };

    playToneBurst();
    incomingOrderInterval = setInterval(playToneBurst, 1500);
};

export const stopIncomingOrderAlertSound = () => {
    if (incomingOrderInterval) {
        clearInterval(incomingOrderInterval);
        incomingOrderInterval = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(0);
    }
};

// ---- Web Audio synth fallbacks for each notification type ----

const _playSynthNotes = (notes, oscType = 'sine') => {
    try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return;
        const ctx = new AudioCtxClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        notes.forEach(({ freq, time, duration, volume = 0.4 }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = oscType;
            osc.frequency.setValueAtTime(freq, now + time);
            gain.gain.setValueAtTime(0, now + time);
            gain.gain.linearRampToValueAtTime(volume, now + time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + time);
            osc.stop(now + time + duration);
        });
    } catch (e) {}
};

// Order Placed: upbeat ascending ding-ding
export const playWebAudioOrderAccepted = () => _playSynthNotes([
    { freq: 659.25, time: 0,    duration: 0.15 }, // E5
    { freq: 783.99, time: 0.12, duration: 0.15 }, // G5
    { freq: 1046.50,time: 0.24, duration: 0.30 }, // C6
], 'sine');

// Order Delivered: triumphant 3-tone fanfare
export const playWebAudioOrderDelivered = () => _playSynthNotes([
    { freq: 523.25, time: 0,    duration: 0.12 }, // C5
    { freq: 659.25, time: 0.12, duration: 0.12 }, // E5
    { freq: 783.99, time: 0.24, duration: 0.12 }, // G5
    { freq: 1046.50,time: 0.36, duration: 0.40, volume: 0.5 }, // C6 strong
], 'triangle');

// Order Cancelled: descending dull thud
export const playWebAudioOrderCancelled = () => _playSynthNotes([
    { freq: 400, time: 0,    duration: 0.20, volume: 0.35 },
    { freq: 300, time: 0.22, duration: 0.30, volume: 0.25 },
], 'sawtooth');
