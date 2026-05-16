import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile,
  Patch // Added for future updates
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  async getAll() {
    return this.communitiesService.getAllCommunities();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.communitiesService.findById(id);
  }

  // =========================
  // CREATE COMMUNITY
  // =========================
  @Post('create')
  @UseInterceptors(FileInterceptor('file')) 
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { 
      name: string; 
      minCoins: number; 
      description?: string 
    }, 
    @Req() req: any
  ) {
    // Validation moved to Service
    return this.communitiesService.createCommunity(
      req.user.id, 
      body.name, 
      body.minCoins,
      body.description,
      file // Pass the file for Cloudinary upload
    );
  }

  @Post('join')
  async join(
    @Body() body: { communityId: string }, 
    @Req() req: any
  ) {
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
    return this.communitiesService.createPost(
      body.communityId, 
      req.user.id,
      req.user.username,
      body.text, 
      body.voiceUrl
    );
  }
}