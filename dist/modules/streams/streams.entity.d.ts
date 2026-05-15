export declare class LiveSession {
    id: string;
    creatorId: string;
    creatorName: string;
    platform: 'YOUTUBE' | 'TWITCH' | 'TIKTOK';
    platformStreamId: string;
    isLive: boolean;
    title: string;
    startedAt: Date;
    thumbnailUrl: string;
}
