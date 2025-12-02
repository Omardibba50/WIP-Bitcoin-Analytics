/**
 * WebSocket Service
 * Real-time data updates with automatic reconnection and polling fallback
 */

import { API_CONFIG, FEATURES, POLLING_INTERVALS } from '../constants/config';
import { logger } from '../utils/logger';

const wsLogger = logger.createScope('WebSocket');

/**
 * WebSocket Client with automatic reconnection and fallback
 */
class WebSocketClient {
  constructor(options = {}) {
    this.url = options.url || API_CONFIG.WS_URL;
    this.enabled = FEATURES.WEBSOCKET_ENABLED;
    this.fallbackToPolling = options.fallbackToPolling !== false;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.subscriptions = new Map();
    this.messageHandlers = new Set();
    this.pollingIntervals = new Map();
    this.isConnected = false;
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (!this.enabled) {
      wsLogger.info('WebSocket disabled, using polling fallback');
      this.startPollingFallback();
      return;
    }

    if (this.isConnected || this.isConnecting) {
      wsLogger.warn('Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    wsLogger.info(`Connecting to WebSocket: ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        wsLogger.info('WebSocket connected');

        // Stop polling fallback if running
        this.stopPollingFallback();

        // Resubscribe to all channels
        this.resubscribe();

        // Notify handlers
        this.notifyHandlers({ type: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          wsLogger.debug('WebSocket message received', data);
          this.notifyHandlers(data);
        } catch (error) {
          wsLogger.error('Failed to parse WebSocket message', error);
        }
      };

      this.ws.onerror = (error) => {
        wsLogger.error('WebSocket error', error);
        this.notifyHandlers({ type: 'error', error });
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        wsLogger.info('WebSocket disconnected', { code: event.code, reason: event.reason });

        this.notifyHandlers({ type: 'disconnected', code: event.code });

        // Attempt reconnection
        if (this.shouldReconnect) {
          this.reconnect();
        }
      };
    } catch (error) {
      this.isConnecting = false;
      wsLogger.error('Failed to create WebSocket connection', error);
      
      if (this.fallbackToPolling) {
        this.startPollingFallback();
      }
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopPollingFallback();
    this.isConnected = false;
    wsLogger.info('WebSocket disconnected (manual)');
  }

  /**
   * Reconnect with exponential backoff
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      wsLogger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      
      if (this.fallbackToPolling) {
        wsLogger.info('Falling back to polling');
        this.startPollingFallback();
      }
      
      return;
    }

    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.reconnectAttempts++;
    wsLogger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel).add(callback);

    // Send subscription message if connected
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        channel,
      });
    }

    wsLogger.info(`Subscribed to channel: ${channel}`);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel, callback) {
    const channelCallbacks = this.subscriptions.get(channel);
    
    if (channelCallbacks) {
      channelCallbacks.delete(callback);
      
      if (channelCallbacks.size === 0) {
        this.subscriptions.delete(channel);
        
        // Send unsubscribe message if connected
        if (this.isConnected) {
          this.send({
            type: 'unsubscribe',
            channel,
          });
        }
      }
    }

    wsLogger.info(`Unsubscribed from channel: ${channel}`);
  }

  /**
   * Resubscribe to all channels (after reconnection)
   */
  resubscribe() {
    if (!this.isConnected) return;

    const channels = Array.from(this.subscriptions.keys());
    
    if (channels.length > 0) {
      this.send({
        type: 'subscribe',
        channels,
      });
      
      wsLogger.info(`Resubscribed to ${channels.length} channels`);
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (!this.isConnected || !this.ws) {
      wsLogger.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      wsLogger.error('Failed to send WebSocket message', error);
      return false;
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler) {
    this.messageHandlers.add(handler);
    
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Notify all message handlers
   */
  notifyHandlers(data) {
    // Notify channel-specific subscribers
    if (data.channel) {
      const channelCallbacks = this.subscriptions.get(data.channel);
      if (channelCallbacks) {
        channelCallbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            wsLogger.error(`Channel callback error: ${data.channel}`, error);
          }
        });
      }
    }

    // Notify global message handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        wsLogger.error('Message handler error', error);
      }
    });
  }

  /**
   * Start polling fallback
   */
  startPollingFallback() {
    if (!this.fallbackToPolling) return;

    wsLogger.info('Starting polling fallback');

    // Poll each subscribed channel
    this.subscriptions.forEach((callbacks, channel) => {
      if (this.pollingIntervals.has(channel)) return;

      const interval = this.getPollingInterval(channel);
      
      const intervalId = setInterval(async () => {
        try {
          const data = await this.fetchChannelData(channel);
          this.notifyHandlers({ channel, ...data });
        } catch (error) {
          wsLogger.error(`Polling error for channel: ${channel}`, error);
        }
      }, interval);

      this.pollingIntervals.set(channel, intervalId);
    });
  }

  /**
   * Stop polling fallback
   */
  stopPollingFallback() {
    this.pollingIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.pollingIntervals.clear();
    wsLogger.info('Polling fallback stopped');
  }

  /**
   * Get polling interval for channel
   */
  getPollingInterval(channel) {
    const intervalMap = {
      'blocks': POLLING_INTERVALS.BLOCKS,
      'mempool': POLLING_INTERVALS.MEMPOOL,
      'prices': POLLING_INTERVALS.PRICES,
      'mining': POLLING_INTERVALS.MINING,
      'lightning': POLLING_INTERVALS.LIGHTNING,
    };

    return intervalMap[channel] || POLLING_INTERVALS.NETWORK_STATS;
  }

  /**
   * Fetch data for channel (polling fallback)
   */
  async fetchChannelData(channel) {
    // Import API client dynamically to avoid circular dependency
    const { default: api } = await import('./apiClient');

    const channelMap = {
      'blocks': () => api.block.getLatest(1),
      'mempool': () => api.mempool.getStats(),
      'prices': () => api.price.getSummary(),
      'mining': () => api.mining.getEconomics(),
      'lightning': () => api.lightning.getStats(),
    };

    const fetchFn = channelMap[channel];
    if (!fetchFn) {
      throw new Error(`Unknown channel: ${channel}`);
    }

    return fetchFn();
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      enabled: this.enabled,
      subscriptions: Array.from(this.subscriptions.keys()),
      reconnectAttempts: this.reconnectAttempts,
      usingPolling: this.pollingIntervals.size > 0,
    };
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();

// Auto-connect in browser
if (typeof window !== 'undefined') {
  // Connect when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      websocketClient.connect();
    });
  } else {
    websocketClient.connect();
  }

  // Disconnect on page unload
  window.addEventListener('beforeunload', () => {
    websocketClient.disconnect();
  });
}

export default websocketClient;
