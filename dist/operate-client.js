"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperateClient = void 0;
class OperateClient {
    constructor(baseUrl) {
        this.credentials = null;
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }
    setCredentials(creds) {
        this.credentials = creds;
    }
    isAuthenticated() {
        return !!(this.credentials && Date.now() < this.credentials.expiresAt);
    }
    getCredentials() {
        return this.credentials;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
}
exports.OperateClient = OperateClient;
