import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from './streams.entity';

@Injectable()
export class StreamsService {
  constructor(
    @InjectRepository(LiveSession)
    private sessionRepo: Repository<LiveSession>,
  ) {}

  /**
   * Helper: Validates URL and extracts necessary IDs
   */
  private parseStreamUrl(platform: string, url: string): { cleanId: string, valid: boolean } {
    try {
      const urlObj = new URL(url);
      
      if (platform === 'YOUTUBE') {
        // Extract Video ID from YouTube URL
        // Supports: https://www.youtube.com/watch?v=VIDEO_ID
        // Supports: https://youtu.be/VIDEO_ID
        let videoId = urlObj.searchParams.get('v');
        if (!videoId && urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.substring(1);
        }
        if (videoId) return { cleanId: videoId, valid: true };
      } 
      else if (platform === 'TIKTOK') {
        // Extract Username from TikTok URL
        // Supports: https://www.tiktok.com/@username/live
        // Supports: https://www.tiktok.com/@username
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0 && pathParts[0].startsWith('@')) {
          const username = pathParts[0].substring(1); // Remove @
          return { cleanId: username, valid: true };
        }
      }
      else if (platform === 'TWITCH') {
        // Extract Channel Name from Twitch URL
        // Supports: https://www.twitch.tv/username
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          return { cleanId: pathParts[0], valid: true };
        }
      }

      return { cleanId: '', valid: false };
    } catch (e) {
      return { cleanId: '', valid: false };
    }
  }

  async startSession(creatorId: string, platform: string, streamUrl: string, title: string) {
    
    // 1. Validate Platform
    const upperPlatform = platform.toUpperCase() as 'YOUTUBE' | 'TWITCH' | 'TIKTOK';
    if (!['YOUTUBE', 'TWITCH', 'TIKTOK'].includes(upperPlatform)) {
      throw new BadRequestException('Invalid platform selected. Choose YouTube, Twitch, or TikTok.');
    }

    // 2. Validate and Parse URL
    if (!streamUrl) {
        throw new BadRequestException('Stream URL is required.');
    }

    const { cleanId, valid } = this.parseStreamUrl(upperPlatform, streamUrl);

    if (!valid || !cleanId) {
      throw new BadRequestException(
        `Invalid ${upperPlatform} URL format. Please paste the full link to your live stream.`
      );
    }

    // 3. Create Session
    const session = this.sessionRepo.create({
      creatorId,
      platform: upperPlatform,
      platformStreamId: cleanId, // Store the clean ID (video_id or username)
      streamUrl: streamUrl,      // Store the original URL for reference
      title: title || 'Live Stream',
      isLive: true,
    });

    return this.sessionRepo.save(session);
  }

  async endSession(sessionId: string) {
    return this.sessionRepo.update(sessionId, { isLive: false });
  }

  /**
   * Get currently active streams
   * IMPROVED: Returns creator details dynamically
   */
  async getActiveStreams() {
    // We use queryBuilder to join the User table and get live profile data
    return this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.creator', 'creator') // Fetch the User relation
      .where('session.isLive = :isLive', { isLive: true })
      .select([
        'session.id',
        'session.platform',
        'session.platformStreamId',
        'session.streamUrl',
        'session.title',
        'session.startedAt',
        'creator.id',    // Return real User ID
        'creator.username', // Return real Username
        'creator.avatarUrl' // Return real Avatar (ensure this column exists in User entity)
      ])
      .orderBy('session.startedAt', 'DESC')
      .getMany();
  }

  async getStreamForManager(sessionId: string) {
    const session = await this.sessionRepo.findOne({ 
      where: { id: sessionId },
      relations: ['creator'] 
    });
    
    if (!session) {
      throw new NotFoundException('Stream session not found');
    }
    
    return session;
  }
}