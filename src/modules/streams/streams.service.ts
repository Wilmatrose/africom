import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm'; // Added MoreThan
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
        let videoId = urlObj.searchParams.get('v');
        if (!videoId && urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.substring(1);
        }
        if (videoId) return { cleanId: videoId, valid: true };
      } 
      else if (platform === 'TIKTOK') {
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0 && pathParts[0].startsWith('@')) {
          const username = pathParts[0].substring(1);
          return { cleanId: username, valid: true };
        }
      }
      else if (platform === 'TWITCH') {
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
    const upperPlatform = platform.toUpperCase() as 'YOUTUBE' | 'TWITCH' | 'TIKTOK';
    if (!['YOUTUBE', 'TWITCH', 'TIKTOK'].includes(upperPlatform)) {
      throw new BadRequestException('Invalid platform selected.');
    }

    if (!streamUrl) {
        throw new BadRequestException('Stream URL is required.');
    }

    const { cleanId, valid } = this.parseStreamUrl(upperPlatform, streamUrl);

    if (!valid || !cleanId) {
      throw new BadRequestException(
        `Invalid ${upperPlatform} URL format. Please paste the full link.`
      );
    }

    const session = this.sessionRepo.create({
      creatorId,
      platform: upperPlatform,
      platformStreamId: cleanId,
      streamUrl: streamUrl,
      title: title || 'Live Stream',
      isLive: true,
      viewers: 0, // Explicitly start at 0
    });

    return this.sessionRepo.save(session);
  }

  async endSession(sessionId: string) {
    // Optionally reset viewers to 0 on end
    return this.sessionRepo.update(sessionId, { isLive: false, viewers: 0 });
  }

  // === NEW VIEWER COUNTER METHODS ===

  async incrementViewers(streamId: string) {
    // Atomic increment: Adds 1 safely
    await this.sessionRepo.increment({ id: streamId }, 'viewers', 1);
    const stream = await this.sessionRepo.findOne({ where: { id: streamId } });
    return stream ? stream.viewers : 0;
  }

  async decrementViewers(streamId: string) {
    // Atomic decrement: Subtracts 1 safely
    // Condition 'viewers > 0' prevents negative numbers
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
        'session.viewers', // ADDED: Return viewer count
        'creator.id',
        'creator.username',
        'creator.avatarUrl'
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