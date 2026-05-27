/**
 * useWebSocket Hook
 * Custom hook for WebSocket integration in React components
 */

import { useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useWebSocket = (token: string, options: UseWebSocketOptions = {}) => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const unsubscribesRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!autoConnect || !token) return;

    const connect = async () => {
      try {
        await websocketService.connect(token);
        onConnect?.();
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        onError?.(error);
      }
    };

    connect();

    // Subscribe to connection events
    const unsubscribeConnected = websocketService.on('connected', () => {
      onConnect?.();
    });

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      onDisconnect?.();
    });

    const unsubscribeError = websocketService.on('error', (error) => {
      onError?.(error);
    });

    unsubscribesRef.current.push(unsubscribeConnected, unsubscribeDisconnected, unsubscribeError);

    return () => {
      unsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribesRef.current = [];
    };
  }, [token, autoConnect, onConnect, onDisconnect, onError]);

  const subscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    const unsubscribe = websocketService.on(eventType, handler);
    unsubscribesRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const send = useCallback((message: any) => {
    websocketService.send(message);
  }, []);

  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    subscribe,
    send,
    isConnected,
    disconnect: () => websocketService.disconnect(),
  };
};

export default useWebSocket;
