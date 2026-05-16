import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure this path is correct

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  // PUBLIC: Get all active streams for the Home Feed
  @Get('live')
  async getLiveStreams() {
    return this.streamsService.getActiveStreams();
  }

  // PUBLIC: Alias for live
  @Get()
  async getAllActiveStreams() {
    return this.streamsService.getActiveStreams();
  }

  // PROTECTED: Creator starts a stream (Extracts ID from Token for security)
  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startStream(
    @Req() req, 
    @Body() body: { 
      platform: string; 
      platformStreamId: string; // e.g., YouTube Video ID or TikTok @username
      title: string 
    }) 
  {
    // FIX: Changed from req.user.userId to req.user.id to match JwtStrategy
    const creatorId = req.user.id; 
    const creatorName = req.user.username; 

    return this.streamsService.startSession(
      creatorId, 
      body.platform, 
      body.platformStreamId, 
      body.title,
      creatorName
    );
  }

  // PROTECTED: Creator stops a stream
  @UseGuards(JwtAuthGuard)
  @Post('end/:id')
  async endStream(@Param('id') id: string, @Req() req) {
    // Optional: Add logic to verify req.user.id owns this stream
    return this.streamsService.endSession(id);
  }

  // PROTECTED: Creator fetches data for the "Stream Manager" page
  @UseGuards(JwtAuthGuard)
  @Get('manager/:sessionId')
  async getManagerData(@Param('sessionId') sessionId: string) {
    return this.streamsService.getStreamForManager(sessionId);
  }
}