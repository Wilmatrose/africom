import { User } from '../users/entities/user.entity';
export declare class Tournament {
    id: string;
    hostId: string;
    host: User;
    title: string;
    status: string;
    bracketImageUrl: string;
    entryFeeCoins: number;
    participants: TournamentParticipant[];
    createdAt: Date;
}
export declare class GroupMessage {
    id: string;
    groupId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    voiceNoteUrl: string;
    isPinned: boolean;
    createdAt: Date;
}
export declare class TournamentParticipant {
    id: string;
    tournamentId: string;
    userId: string;
    tournament: Tournament;
    joinedAt: Date;
}
