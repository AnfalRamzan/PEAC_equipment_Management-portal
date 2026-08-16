// src/components/NotificationSound.jsx
// ✅ COMPLETE FIXED - AudioContext with user interaction

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const NotificationSound = () => {
    const { unreadCount } = useSelector((state) => state.notifications);
    const prevCount = useRef(0);
    const audioContextRef = useRef(null);
    const [isAudioReady, setIsAudioReady] = useState(false);

    // ✅ Initialize AudioContext on user interaction
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                try {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioContextRef.current.state === 'suspended') {
                        audioContextRef.current.resume();
                    }
                    setIsAudioReady(true);
                } catch (e) {
                    // Silent fail - browser may block audio
                }
            } else if (audioContextRef.current.state === 'suspended') {
                try {
                    audioContextRef.current.resume();
                    setIsAudioReady(true);
                } catch (e) {
                    // Ignore
                }
            }
        };

        // ✅ Resume on user interaction
        const handleUserInteraction = () => {
            initAudio();
        };

        // Listen for user gestures
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);

        // ✅ Try to init immediately (may fail, but that's ok)
        setTimeout(initAudio, 100);

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
    }, []);

    // Check if sound is enabled
    const isSoundEnabled = () => {
        const saved = localStorage.getItem('notificationSound');
        return saved !== null ? JSON.parse(saved) : true;
    };

    const playSound = () => {
        if (!isSoundEnabled()) return;
        
        // ✅ Don't play if audio context is not ready or suspended
        if (!audioContextRef.current) return;
        if (audioContextRef.current.state !== 'running') {
            // Try to resume
            try {
                audioContextRef.current.resume();
                if (audioContextRef.current.state !== 'running') {
                    return;
                }
            } catch (e) {
                return;
            }
        }

        try {
            const audioCtx = audioContextRef.current;
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
            // Silent fail - browser may block audio
        }
    };

    useEffect(() => {
        // ✅ Only play if audio is ready
        if (unreadCount > prevCount.current && isAudioReady) {
            playSound();
        }
        prevCount.current = unreadCount;
    }, [unreadCount, isAudioReady]);

    return null;
};

export default NotificationSound;