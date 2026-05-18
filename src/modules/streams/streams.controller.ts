import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { StreamsService } from './streams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

// DTO for creating a stream
class StartStreamDto {
  platform: string;
  streamUrl: string;
  title: string;
}

@ApiTags('Streams')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get all currently active live streams' })
  async getLiveStreams() {
    return this.streamsService.getActiveStreams();
  }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new live stream session' })
  async startStream(
    @Req() req, 
    @Body() body: StartStreamDto
  ) {
    return this.streamsService.startSession(
      req.user.id, 
      body.platform, 
      body.streamUrl, 
      body.title
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('end/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End a live stream session' })
  async endStream(@Param('id') id: string, @Req() req) {
    // 1. Fetch the session to check ownership
    const session = await this.streamsService.getStreamForManager(id);

    // 2. Security Check: Ensure the requester is the creator
    if (session.creatorId !== req.user.id) {
      throw new ForbiddenException('You are not authorized to end this stream.');
    }

    return this.streamsService.endSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manager/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stream data for the creator manager view' })
  async getManagerData(@Param('sessionId') sessionId: string) {
    return this.streamsService.getStreamForManager(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-active-stream')
  @ApiOperation({ summary: 'Check if current user has an active stream' })
  async getMyActiveStream(@Req() req) {
    const stream = await this.streamsService.findActiveStreamByCreator(req.user.id);
    return stream; // Returns null if not found, or the stream object if live
  }

}