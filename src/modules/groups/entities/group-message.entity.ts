import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';
import { GroupMessageReaction } from './group-message-reaction.entity';

@Entity()
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  senderId: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isPinned: boolean;

  // --- Reply Feature ---
  @Column({ nullable: true })
  replyToId: string;

  @ManyToOne(() => GroupMessage, message => message.replies, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replyToId' })
  replyTo: GroupMessage;

  @OneToMany(() => GroupMessage, message => message.replyTo)
  replies: GroupMessage[];
  // ----------------------

  // --- Reaction Feature (NEW) ---
  @OneToMany(() => GroupMessageReaction, reaction => reaction.message, { cascade: true })
  reactions: GroupMessageReaction[];
  // ------------------------------

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}