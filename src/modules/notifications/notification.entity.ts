import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Adjusted path to standard location

@Entity('notifications') // Explicit table name
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // The content of the notification
  @Column()
  message: string;

  // Types: 'NEW_FOLLOWER', 'TOURNAMENT_START', 'GROUP_KICK', 'COMMUNITY_JOIN'
  @Column()
  type: string; 

  // ID of the related object (e.g., followerId, tournamentId)
  @Column({ nullable: true })
  relatedId: string; 

  @Column({ default: false })
  isRead: boolean;

  // Relationship to the user receiving the notification
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // If user is deleted, delete their notifications
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}