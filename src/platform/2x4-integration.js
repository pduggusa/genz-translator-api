// 2x4 Platform Integration - Student Success Tracking
// This module handles OAuth authentication and student progress reporting to 2x4.hacsawduggan.com

const https = require('https');
const crypto = require('crypto');

class Platform2x4Integration {
  constructor() {
    this.oauthKey = process.env.PLATFORM_2X4_OAUTH_KEY;
    this.apiUrl = process.env.PLATFORM_2X4_API_URL || 'https://2x4.hacsawduggan.com';
    this.trackingEnabled = process.env.STUDENT_TRACKING_ENABLED === 'true';
    this.studentId = this.generateAnonymousStudentId();

    if (!this.oauthKey && this.trackingEnabled) {
      console.warn('⚠️ 2x4 Platform: OAuth key not configured, tracking disabled');
      this.trackingEnabled = false;
    }
  }

  generateAnonymousStudentId() {
    // Generate anonymous but consistent student ID based on deployment environment
    const envFingerprint = [
      process.env.HOSTNAME || 'localhost',
      process.env.USER || 'anonymous',
      Date.now().toString().slice(0, -3) // Stable for session
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(envFingerprint)
      .digest('hex')
      .substring(0, 16);
  }

  async trackStudentProgress(event, metadata = {}) {
    if (!this.trackingEnabled) return { success: false, reason: 'tracking_disabled' };

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      student_id: this.studentId,
      session_data: {
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        academy_version: process.env.VERSION || '1.0.0',
        ...metadata
      }
    };

    try {
      const result = await this.sendToApi('/api/student-tracking', payload);
      console.log(`📊 2x4 Platform: Tracked '${event}' for student ${this.studentId.substring(0, 8)}...`);
      return result;
    } catch (error) {
      console.error('🚨 2x4 Platform tracking error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendToApi(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiUrl);
      const payload = JSON.stringify(data);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${this.oauthKey}`,
          'User-Agent': `VibeCodingAcademy/${process.env.VERSION || '1.0.0'}`,
          'X-Academy-Student': this.studentId
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: result });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${result.error || responseData}`));
            }
          } catch (parseError) {
            reject(new Error(`Parse error: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  }

  // Pre-defined tracking events for common student milestones
  async trackEnvironmentSetup(setupTime) {
    return this.trackStudentProgress('environment_setup_complete', {
      setup_time_ms: setupTime,
      npm_version: process.env.npm_version,
      node_version: process.version
    });
  }

  async trackFirstApiSuccess(endpoint) {
    return this.trackStudentProgress('first_api_call_success', {
      endpoint,
      port: process.env.PORT || 3000
    });
  }

  async trackSecurityScanComplete(results) {
    return this.trackStudentProgress('security_scan_complete', {
      vulnerabilities_found: results.vulnerabilities || 0,
      security_score: results.score || 'unknown'
    });
  }

  async trackDeploymentSuccess(platform) {
    return this.trackStudentProgress('deployment_success', {
      deployment_platform: platform,
      is_azure: !!process.env.WEBSITE_SITE_NAME
    });
  }

  async trackLearningMilestone(milestone, details = {}) {
    return this.trackStudentProgress('learning_milestone', {
      milestone,
      ...details
    });
  }

  // Health check endpoint for 2x4 platform connectivity
  async healthCheck() {
    if (!this.trackingEnabled) {
      return {
        status: 'disabled',
        oauth_configured: !!this.oauthKey,
        student_id: this.studentId
      };
    }

    try {
      const result = await this.sendToApi('/api/health', {
        student_id: this.studentId,
        academy_version: process.env.VERSION || '1.0.0'
      });

      return {
        status: 'connected',
        platform_status: result.data.status || 'unknown',
        student_id: this.studentId,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        student_id: this.studentId
      };
    }
  }
}

// Global instance for the academy
const platform2x4 = new Platform2x4Integration();

module.exports = {
  Platform2x4Integration,
  platform2x4
};