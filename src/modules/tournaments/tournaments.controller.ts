import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Patch, 
  Delete,
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tournaments')
@UseGuards(JwtAuthGuard) 
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async getAll() {
    return this.tournamentsService.getTournaments();
  }

  // =========================
  // CREATE TOURNAMENT (With Image Upload)
  // =========================
  @Post('create')
  @UseInterceptors(FileInterceptor('file')) 
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { 
      title: string; 
      fee: number;
      maxParticipants?: number; // ✅ NEW: Accept maxParticipants
    },
    @Req() req: any
  ) {
    return this.tournamentsService.createTournament(
      req.user.id, 
      body.title, 
      file, 
      body.fee,
      body.maxParticipants
    );
  }

  @Post('join')
  async join(
    @Body() body: { tournamentId: string }, 
    @Req() req: any
  ) {
    return this.tournamentsService.joinTournament(
      body.tournamentId,
      req.user.id, 
    );
  }

  // --- START TOURNAMENT ---
  @Patch(':id/start')
  async startTournament(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.tournamentsService.startTournament(id, req.user.id);
  }

  // --- END TOURNAMENT ---
  @Patch(':id/end')
  async endTournament(
    @Param('id') id: string,
    @Body() body: { winnerId?: string }, 
    @Req() req: any
  ) {
    return this.tournamentsService.endTournament(id, req.user.id, body.winnerId);
  }

  // --- CANCEL TOURNAMENT (HOST ONLY) ---
  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.tournamentsService.cancelTournament(id, req.user.id);
  }

  // --- KICK PARTICIPANT (HOST ONLY) ---
  @Post(':id/kick/:userId')
  async kick(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Req() req: any
  ) {
    return this.tournamentsService.kickParticipant(id, targetUserId, req.user.id);
  }

  @Get('messages/:groupId')
  async getMessages(@Param('groupId') groupId: string) {
    return this.tournamentsService.getMessages(groupId);
  }

  @Post('message')
  async sendMessage(
    @Body() body: { 
      groupId: string; 
      content: string 
    },
    @Req() req: any
  ) {
    return this.tournamentsService.sendMessage(
      body.groupId, 
      req.user.id, 
      req.user.username, 
      body.content
    );
  }
}