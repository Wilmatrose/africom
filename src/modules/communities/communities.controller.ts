import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile,
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

  // =========================
  // CREATE POST (CREATOR ONLY)
  // =========================
  @Post('post')
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { 
      communityId: string; 
      text?: string
    },
    @Req() req: any
  ) {
    return this.communitiesService.createPost(
      body.communityId, 
      req.user.id,
      req.user.username,
      body.text,
      file
    );
  }

  // =========================
  // REACTION ENDPOINT
  // =========================
  @Post('posts/:postId/react')
  async reactToPost(
    @Param('postId') postId: string,
    @Body() body: { emoji: string },
    @Req() req: any
  ) {
    return this.communitiesService.toggleReaction(
      postId,
      req.user.id,
      body.emoji,
    );
  }

  // =========================
  // DELETE COMMUNITY
  // =========================
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.communitiesService.deleteCommunity(id, req.user.id);
  }
}