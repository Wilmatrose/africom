import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure you have this import

@Controller('communities')
@UseGuards(JwtAuthGuard) // Apply Auth Guard globally to this controller
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  async getAll() {
    return this.communitiesService.getAllCommunities();
  }

  // ==================================================
  // NEW: GET SINGLE COMMUNITY DETAILS (WITH CREATOR)
  // ==================================================
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.communitiesService.findById(id);
  }

  @Post('create')
  async create(
    @Body() body: { name: string; minCoins: number }, 
    @Req() req: any
  ) {
    // Secure: Force creatorId to be the logged-in user
    return this.communitiesService.createCommunity(
      req.user.id, 
      body.name, 
      body.minCoins
    );
  }

  @Post('join')
  async join(
    @Body() body: { communityId: string }, 
    @Req() req: any
  ) {
    // Secure: Use userId from token, not body
    return this.communitiesService.joinCommunity(
      body.communityId, 
      req.user.id
    );
  }

  @Get(':id/posts')
  async getPosts(@Param('id') id: string) {
    return this.communitiesService.getPosts(id);
  }

  @Post('post')
  async createPost(
    @Body() body: { 
      communityId: string; 
      text?: string; 
      voiceUrl?: string 
    },
    @Req() req: any
  ) {
    // Secure: Use authorId and authorName from token
    return this.communitiesService.createPost(
      body.communityId, 
      req.user.id,
      req.user.username, // Ensure username is attached to your JWT payload
      body.text, 
      body.voiceUrl
    );
  }
}