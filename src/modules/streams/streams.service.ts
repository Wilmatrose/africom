import { Injectable, NotFoundException } from '@nestjs/common';
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
   * Creator starts a session
   * IMPROVED: Auto-generates Thumbnail URL based on platform
   */
  async startSession(creatorId: string, platform: string, streamId: string, title: string, creatorName: string) {
    
    let thumbnailUrl = '';

    // 1. LOGIC: Generate Thumbnail automatically
    if (platform.toUpperCase() === 'YOUTUBE') {
      // YouTube provides a predictable URL for thumbnails using the Video ID
      thumbnailUrl = `https://img.youtube.com/vi/${streamId}/maxresdefault.jpg`;
    } else {
      // For TikTok/Twitch, use a generated Avatar based on the Creator's Name
      thumbnailUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=random&color=fff&size=400`;
    }

    // 2. Create the Session Entity
    const session = this.sessionRepo.create({
      creatorId,
      creatorName,
      platform: platform.toUpperCase() as 'YOUTUBE' | 'TWITCH' | 'TIKTOK',
      platformStreamId: streamId,
      title,
      thumbnailUrl, // Save the generated URL
      isLive: true,
    });

    return this.sessionRepo.save(session);
  }

  /**
   * Creator ends a session
   */
  async endSession(sessionId: string) {
    return this.sessionRepo.update(sessionId, { isLive: false });
  }

  /**
   * Get currently active streams (for the Home Feed)
   */
  async getActiveStreams() {
    return this.sessionRepo.find({
      where: { isLive: true },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * FIX: Added missing method used by Controller for Stream Manager
   */
  async getStreamForManager(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    
    if (!session) {
      throw new NotFoundException('Stream session not found');
    }
    
    return session;
  }
}