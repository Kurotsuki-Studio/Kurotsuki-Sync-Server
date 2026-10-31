import { IncomingMessage } from 'http';
export declare function verifyToken(token: string | undefined | null): boolean;
export declare function extractTokenFromRequest(req: IncomingMessage): string | undefined;
