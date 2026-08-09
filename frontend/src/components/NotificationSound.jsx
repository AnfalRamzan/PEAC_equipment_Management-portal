// src/components/NotificationSound.jsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const NotificationSound = () => {
    const { unreadCount } = useSelector((state) => state.notifications);
    const prevCount = useRef(0);

    // Check if sound is enabled
    const isSoundEnabled = () => {
        const saved = localStorage.getItem('notificationSound');
        return saved !== null ? JSON.parse(saved) : true;
    };

    const playSound = () => {
        if (!isSoundEnabled()) return;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const tones = [
                { freq: 800, delay: 0 },
                { freq: 1000, delay: 0.18 },
                { freq: 1200, delay: 0.36 }
            ];
            tones.forEach(({ freq, delay }) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                const startTime = audioCtx.currentTime + delay;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.15);
            });
        } catch(e) {
            console.log('🔊 Audio not supported');
        }
    };

    useEffect(() => {
        if (unreadCount > prevCount.current) {
            playSound();
        }
        prevCount.current = unreadCount;
    }, [unreadCount]);

    return null;
};

export default NotificationSound;