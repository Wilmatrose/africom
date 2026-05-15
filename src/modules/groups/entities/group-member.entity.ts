import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

export enum GroupMemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity()
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: GroupMemberRole, default: GroupMemberRole.MEMBER })
  role: GroupMemberRole;

  // Relationship to Group
  @ManyToOne(() => Group, group => group.members)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  // Relationship to User
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}