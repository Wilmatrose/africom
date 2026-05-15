import { Repository } from 'typeorm';
import { LiveSession } from './streams.entity';
export declare class StreamsService {
    private sessionRepo;
    constructor(sessionRepo: Repository<LiveSession>);
    startSession(creatorId: string, platform: string, streamId: string, title: string, creatorName: string): Promise<LiveSession>;
    endSession(sessionId: string): Promise<import("typeorm").UpdateResult>;
    getActiveStreams(): Promise<LiveSession[]>;
    getStreamForManager(sessionId: string): Promise<LiveSession>;
}
