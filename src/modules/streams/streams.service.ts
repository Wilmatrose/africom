import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from './streams.entity';

// Define allowed platforms for strict typing
type Platform = 'YOUTUBE' | 'TWITCH' | 'TIKTOK';

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
  async startSession(
    creatorId: string, 
    platform: string, 
    streamId: string, 
    title: string, 
    creatorName: string
  ) {
    
    let thumbnailUrl = '';
    const upperPlatform = platform.toUpperCase() as Platform;

    // 1. LOGIC: Generate Thumbnail automatically
    if (upperPlatform === 'YOUTUBE') {
      // YouTube provides a predictable URL for thumbnails using the Video ID
      thumbnailUrl = `https://img.youtube.com/vi/${streamId}/maxresdefault.jpg`;
    } else {
      // For TikTok/Twitch, use a generated Avatar based on the Creator's Name
      // We use creatorName for the avatar, but you could use the cleaned streamId if preferred
      thumbnailUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=random&color=fff&size=400`;
    }

    // 2. CLEANUP: Remove '@' from TikTok stream IDs if present
    let cleanStreamId = streamId;
    if (upperPlatform === 'TIKTOK' && cleanStreamId.startsWith('@')) {
      cleanStreamId = cleanStreamId.substring(1);
    }

    // 3. Create the Session Entity
    const session = this.sessionRepo.create({
      creatorId,
      creatorName,
      platform: upperPlatform,
      platformStreamId: cleanStreamId, // Use the cleaned ID
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