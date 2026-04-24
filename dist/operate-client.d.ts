export interface OperateCredentials {
    ssoToken: string;
    sessionCookie: string;
    csrfToken: string;
    expiresAt: number;
}
export declare class OperateClient {
    private baseUrl;
    private credentials;
    constructor(baseUrl: string);
    setCredentials(creds: OperateCredentials | null): void;
    isAuthenticated(): boolean;
    getCredentials(): OperateCredentials | null;
    getBaseUrl(): string;
}
