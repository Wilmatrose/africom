import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LiveSession } from './streams.entity';

@Injectable()
export class StreamsService {
  constructor(
    @InjectRepository(LiveSession)
    private sessionRepo: Repository<LiveSession>,
  ) {}

  /**
   * Helper: Robust URL Parsing
   * Handles standard links, short links, and live paths for all platforms.
   */
  private parseStreamUrl(platform: string, url: string): { cleanId: string, valid: boolean } {
    try {
      // Ensure URL is parseable
      const urlObj = new URL(url);
      
      if (platform === 'YOUTUBE') {
        // 1. Standard Watch URL: youtube.com/watch?v=ID
        let videoId = urlObj.searchParams.get('v');
        
        // 2. Short URL: youtu.be/ID
        if (!videoId && urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.substring(1).split('/')[0];
        }

        // 3. Live URL: youtube.com/live/ID
        if (!videoId && urlObj.pathname.startsWith('/live/')) {
          videoId = urlObj.pathname.split('/')[2];
        }
        
        // 4. Shorts URL: youtube.com/shorts/ID
        if (!videoId && urlObj.pathname.startsWith('/shorts/')) {
          videoId = urlObj.pathname.split('/')[2];
        }

        if (videoId) return { cleanId: videoId, valid: true };
      } 
      else if (platform === 'TIKTOK') {
        // Check if it's a TikTok domain (handles www.tiktok.com and vt.tiktok.com)
        if (urlObj.hostname.includes('tiktok.com')) {
          
          // Attempt 1: Extract Username from path (e.g., /@username/live or /@username)
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          const usernamePart = pathParts.find(p => p.startsWith('@'));

          if (usernamePart) {
            // Found a username like "faith"
            return { cleanId: usernamePart.substring(1), valid: true };
          }

          // Attempt 2: Handle Short Links (vt.tiktok.com/XYZ)
          // We cannot extract a username from a short link without a network redirect.
          // STRATEGY: Save the full URL as the ID so the frontend can still use it.
          return { cleanId: url, valid: true };
        }
      }
      else if (platform === 'TWITCH') {
        // Handle twitch.tv and www.twitch.tv
        if (urlObj.hostname.includes('twitch.tv')) {
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          // Twitch URLs are usually twitch.tv/username
          if (pathParts.length > 0) {
            // We take the first part (e.g., 'faith')
            // We ignore secondary parts like /clips /videos for now, focusing on live channel
            return { cleanId: pathParts[0], valid: true };
          }
        }
      }

      return { cleanId: '', valid: false };
    } catch (e) {
      return { cleanId: '', valid: false };
    }
  }

  async startSession(creatorId: string, platform: string, streamUrl: string, title: string) {
    const upperPlatform = platform.toUpperCase() as 'YOUTUBE' | 'TWITCH' | 'TIKTOK';
    if (!['YOUTUBE', 'TWITCH', 'TIKTOK'].includes(upperPlatform)) {
      throw new BadRequestException('Invalid platform selected.');
    }

    if (!streamUrl) {
        throw new BadRequestException('Stream URL is required.');
    }

    // Use the improved parser
    const { cleanId, valid } = this.parseStreamUrl(upperPlatform, streamUrl);

    if (!valid || !cleanId) {
      throw new BadRequestException(
        `Invalid ${upperPlatform} URL format. Please paste the full link.`
      );
    }

    const session = this.sessionRepo.create({
      creatorId,
      platform: upperPlatform,
      platformStreamId: cleanId, // This now holds the VideoID, Username, or Full URL (for short links)
      streamUrl: streamUrl,
      title: title || 'Live Stream',
      isLive: true,
      viewers: 0,
    });

    return this.sessionRepo.save(session);
  }

  async endSession(sessionId: string) {
    return this.sessionRepo.update(sessionId, { isLive: false, viewers: 0 });
  }

  // === VIEWER COUNTER METHODS ===

  async incrementViewers(streamId: string) {
    await this.sessionRepo.increment({ id: streamId }, 'viewers', 1);
    const stream = await this.sessionRepo.findOne({ where: { id: streamId } });
    return stream ? stream.viewers : 0;
  }

  async decrementViewers(streamId: string) {
    await this.sessionRepo.decrement({ id: streamId, viewers: MoreThan(0) }, 'viewers', 1);
    const stream = await this.sessionRepo.findOne({ where: { id: streamId } });
    return stream ? stream.viewers : 0;
  }

  // ===================================

  async getActiveStreams() {
    return this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.creator', 'creator')
      .where('session.isLive = :isLive', { isLive: true })
      .select([
        'session.id',
        'session.platform',
        'session.platformStreamId',
        'session.streamUrl',
        'session.title',
        'session.startedAt',
        'session.viewers',
        'creator.id',
        'creator.username',
        'creator.avatarUrl'
      ])
      .orderBy('session.startedAt', 'DESC')
      .getMany();
  }


  async findActiveStreamByCreator(creatorId: string) {
    return this.sessionRepo.findOne({
      where: { creatorId: creatorId, isLive: true },
      relations: ['creator']
    });
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