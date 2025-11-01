/**
 * Console Error Capture Service
 * Automatically captures browser/console errors and sends them to the error management system
 */

import api from './api';

class ErrorCaptureService {
  constructor() {
    this.isCapturing = false;
    this.sessionId = this.generateSessionId();
    this.errorCount = 0;
  }

  /**
   * Generate a session ID for this browser session
   */
  generateSessionId() {
    let sessionId = sessionStorage.getItem('glitchguard_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('glitchguard_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Capture console errors
   */
  captureConsoleError(error, isError = true) {
    if (!this.isCapturing) return;

    this.errorCount++;

    // Extract error details
    const errorData = {
      severity: this.determineSeverity(error),
      service: 'frontend-app',
      errorType: 'browser',
      message: error.message || 'Unknown error',
      stackTrace: error.stack || null,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      metadata: {
        capturedFrom: 'console',
        isUnhandledError: isError,
        timestamp: new Date().toISOString(),
        errorCount: this.errorCount,
        pageUrl: window.location.href
      }
    };

    // Send to error management system
    this.sendErrorToServer(errorData);
  }

  /**
   * Determine error severity based on error type
   */
  determineSeverity(error) {
    if (error.message?.toLowerCase().includes('critical') || 
        error.message?.toLowerCase().includes('payment') ||
        error.message?.toLowerCase().includes('auth')) {
      return 'critical';
    }
    if (error.message?.toLowerCase().includes('failed') ||
        error.message?.toLowerCase().includes('timeout')) {
      return 'high';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Send error to server
   */
  async sendErrorToServer(errorData) {
    try {
      await api.createLog(errorData);
      console.log('✅ Error captured and logged to GlitchGuard');
    } catch (error) {
      console.error('Failed to send error to server:', error);
    }
  }

  /**
   * Start capturing errors
   */
  start() {
    if (this.isCapturing) {
      console.warn('Error capture is already running');
      return;
    }

    this.isCapturing = true;
    console.log('🛡️  GlitchGuard error capture enabled');

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureConsoleError({
        message: event.message,
        stack: event.error?.stack || null,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, true);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureConsoleError({
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stack: event.reason?.stack || null
      }, true);
    });

    // Override console.error to capture
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Capture console errors
      const errorMessage = args
        .map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
        .join(' ');

      this.captureConsoleError({
        message: errorMessage,
        stack: new Error().stack
      }, false);
    };
  }

  /**
   * Stop capturing errors
   */
  stop() {
    if (!this.isCapturing) return;

    this.isCapturing = false;
    console.log('⏹️  GlitchGuard error capture disabled');
    
    // Note: We don't remove event listeners to keep it simple
    // In production, you'd want to properly clean them up
  }

  /**
   * Get capture status
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      sessionId: this.sessionId,
      errorsCaptured: this.errorCount
    };
  }
}

// Export singleton instance
const errorCapture = new ErrorCaptureService();

export default errorCapture;

