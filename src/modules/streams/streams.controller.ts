import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get('live')
  async getLiveStreams() {
    return this.streamsService.getActiveStreams();
  }

  @Get()
  async getAllActiveStreams() {
    return this.streamsService.getActiveStreams();
  }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startStream(
    @Req() req, 
    @Body() body: { 
      platform: string; 
      streamUrl: string; // Changed from platformStreamId
      title: string 
    }) 
  {
    // We no longer pass creatorName manually; the service uses creatorId to link
    return this.streamsService.startSession(
      req.user.id, 
      body.platform, 
      body.streamUrl, 
      body.title
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('end/:id')
  async endStream(@Param('id') id: string, @Req() req) {
    // Ideally verify ownership here
    return this.streamsService.endSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manager/:sessionId')
  async getManagerData(@Param('sessionId') sessionId: string) {
    return this.streamsService.getStreamForManager(sessionId);
  }
}