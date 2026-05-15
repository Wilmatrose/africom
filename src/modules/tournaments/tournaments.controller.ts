import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure this path is correct

@Controller('tournaments')
@UseGuards(JwtAuthGuard) // Secure all tournament routes
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async getAll() {
    return this.tournamentsService.getTournaments();
  }

  @Post('create')
  async create(
    @Body() body: { 
      hostId: string; 
      title: string; 
      bracketUrl: string; 
      fee: number 
    },
    @Req() req: any
  ) {
    // Security: Force hostId to be the logged-in user
    return this.tournamentsService.createTournament(
      req.user.id, // overridden for security
      body.title, 
      body.bracketUrl, 
      body.fee
    );
  }

  @Post('join')
  async join(
    @Body() body: { tournamentId: string }, 
    @Req() req: any
  ) {
    return this.tournamentsService.joinTournament(
      body.tournamentId,
      req.user.id, // Get userId from token
    );
  }

  // --- NEW: START TOURNAMENT ---
  @Patch(':id/start')
  async startTournament(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.tournamentsService.startTournament(id, req.user.id);
  }

  // --- NEW: END TOURNAMENT ---
  @Patch(':id/end')
  async endTournament(
    @Param('id') id: string,
    @Body() body: { winnerId?: string }, // Optional winner
    @Req() req: any
  ) {
    return this.tournamentsService.endTournament(id, req.user.id, body.winnerId);
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
      req.user.id, // Secure senderId
      req.user.username, // Use username from token if available, or fetch in service
      body.content
    );
  }
}