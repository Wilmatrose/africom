import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMessage } from './group-message.entity';

@Entity()
export class GroupMessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  userId: string;

  @Column()
  emoji: string;

  @ManyToOne(() => GroupMessage, message => message.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: GroupMessage;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // ==========================================
  // 12 STANDARD REACTION EMOJIS
  // ==========================================
  static readonly ALLOWED_EMOJIS = [
    '👍', // Thumbs Up
    '👎', // Thumbs Down
    '❤️', // Love
    '😂', // Laugh
    '😮', // Wow
    '😢', // Sad
    '😡', // Angry
    '🎉', // Celebrate
    '🔥', // Fire
    '😍', // Heart Eyes
    '🤣', // Rolling Laugh
    '💯', // 100 Points
  ];
}