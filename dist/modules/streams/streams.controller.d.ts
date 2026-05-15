import { StreamsService } from './streams.service';
export declare class StreamsController {
    private readonly streamsService;
    constructor(streamsService: StreamsService);
    getLiveStreams(): Promise<import("./streams.entity").LiveSession[]>;
    getAllActiveStreams(): Promise<import("./streams.entity").LiveSession[]>;
    startStream(req: any, body: {
        platform: string;
        platformStreamId: string;
        title: string;
    }): Promise<import("./streams.entity").LiveSession>;
    endStream(id: string, req: any): Promise<import("typeorm").UpdateResult>;
    getManagerData(sessionId: string): Promise<import("./streams.entity").LiveSession>;
}
