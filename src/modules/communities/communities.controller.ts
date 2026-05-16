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
  BadRequestException 
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

  @Post('create')
  @UseInterceptors(FileInterceptor('file')) // Handles multipart/form-data file upload
  async create(
    @Body() body: { 
      name: string; 
      minCoins: number; 
      description?: string 
    }, 
    @UploadedFile() file: Express.Multer.File, // Captures the uploaded file
    @Req() req: any
  ) {
    // 1. Validate Name
    if (!body.name || body.name.trim() === '') {
      throw new BadRequestException('Community name is required');
    }

    // 2. Call Service (Passing description and file)
    return this.communitiesService.createCommunity(
      req.user.id, 
      body.name, 
      body.minCoins,
      body.description,
      file
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