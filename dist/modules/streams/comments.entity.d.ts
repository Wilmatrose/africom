export declare class Comment {
    id: string;
    sessionId: string;
    userId: string;
    username: string;
    message: string;
    type: 'TEXT' | 'GIFT';
    createdAt: Date;
}
