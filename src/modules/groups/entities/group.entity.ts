import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity'; 

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl!: string;

  @Column({ name: 'profile_pic_url', nullable: true })
  profilePicUrl!: string;

  @Column({ name: 'invite_link', unique: true, nullable: true })
  inviteLink!: string;

  // NEW: Group Lock (Only admins can send messages)
  @Column({ name: 'lock_group', default: false })
  lockGroup!: boolean;

  // NEW: Disappearing Messages Timer (Time in seconds: 0=Off, 86400=24h, 604800=7d)
  @Column({ name: 'disappearing_timer', default: 0 })
  disappearingTimer!: number;

  // Creator of the group
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator!: User;

  @Column({ name: 'creator_id' })
  creatorId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relation to Members
  @OneToMany(() => GroupMember, (member) => member.group, { cascade: true })
  members!: GroupMember[];

  // Relation to Messages
  @OneToMany(() => GroupMessage, (message) => message.group, { cascade: true })
  messages!: GroupMessage[];
}