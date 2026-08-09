import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUnreadCount, fetchNotifications, incrementUnreadCount } from '../redux/slices/notificationSlice';

export const useNotificationWebSocket = () => {
    const dispatch = useDispatch();
    const wsRef = useRef(null);

    useEffect(() => {
        // Create WebSocket connection
        const ws = new WebSocket('ws://localhost:5000/ws/notifications');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('🔌 WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 New notification via WebSocket:', data);
                
                if (data.type === 'new_notification') {
                    // ✅ Immediately update unread count
                    dispatch(incrementUnreadCount());
                    // ✅ Fetch fresh notifications
                    dispatch(fetchNotifications());
                    // ✅ Also fetch unread count to be sure
                    dispatch(fetchUnreadCount());
                }
            } catch (e) {
                console.log('WebSocket message error:', e);
            }
        };

        ws.onerror = (error) => {
            console.log('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket Disconnected');
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                if (wsRef.current?.readyState !== WebSocket.OPEN) {
                    console.log('🔄 Reconnecting WebSocket...');
                    // Reconnect logic can be added here
                }
            }, 5000);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [dispatch]);

    return wsRef;
};