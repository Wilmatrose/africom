import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  // =========================
  // GENERAL GETTERS
  // =========================

  @Get()
  async getAll() {
    return this.communitiesService.getAllCommunities();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.communitiesService.findById(id);
  }

  @Get(':id/posts')
  async getPosts(@Param('id') id: string) {
    return this.communitiesService.getPosts(id);
  }

  // =========================
  // CREATION & JOINING
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

  // =========================
  // POSTING & REACTIONS
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
  // COMMUNITY MANAGEMENT (UPDATE, EXIT, DELETE)
  // =========================

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() body: { 
      name?: string; 
      description?: string; 
      minCoinsToJoin?: number 
    },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    return this.communitiesService.updateCommunity(
      id, 
      req.user.id, 
      {
        name: body.name,
        description: body.description,
        minCoinsToJoin: body.minCoinsToJoin,
        file: file
      }
    );
  }

  @Post(':id/exit')
  async exit(@Param('id') id: string, @Req() req: any) {
    return this.communitiesService.exitCommunity(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.communitiesService.deleteCommunity(id, req.user.id);
  }
}