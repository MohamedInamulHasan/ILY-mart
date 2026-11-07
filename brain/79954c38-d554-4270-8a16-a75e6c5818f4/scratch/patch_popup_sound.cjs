const fs = require('fs');
const path = 'src/components/DeliveryStatusPopup.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Add sound imports
if (!content.includes('playOrderAcceptedSound')) {
    content = content.replace(
        "import { useLanguage } from '../context/LanguageContext';",
        "import { useLanguage } from '../context/LanguageContext';\nimport { playOrderAcceptedSound, playOrderDeliveredSound, playOrderCancelledSound } from '../utils/soundHelper';"
    );
}

// Play sound on open
const oldEffect = `    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            onComplete?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [isOpen, onComplete, duration]);`;

const newEffect = `    useEffect(() => {
        if (!isOpen) return;
        if (type === 'accepted') {
            playOrderAcceptedSound();
        } else if (type === 'delivered') {
            playOrderDeliveredSound();
        } else if (type === 'cancelled') {
            playOrderCancelledSound();
        }
        const timer = setTimeout(() => {
            onComplete?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [isOpen, onComplete, duration, type]);`;

if (content.includes(oldEffect)) {
    content = content.replace(oldEffect, newEffect);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: added sound playback to DeliveryStatusPopup');
} else {
    console.log('Could not find old effect');
}
