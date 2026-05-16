import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer'; // IMPORT THIS

// =========================
// USER ROLE
// =========================
export enum UserRole {
  FAN = 'FAN',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
  COMMUNITY_LEAD = 'COMMUNITY_LEAD',
}

// =========================
// KYC STATUS
// =========================
export enum KYCStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  // =========================
  // SECURITY FIX
  // =========================
  // We use @Exclude() so this field is NEVER sent to the frontend
  // even if it exists in the database object.
  @Exclude() 
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Exclude()
  @Column({ name: 'last_login_ip', type: 'varchar', nullable: true })
  lastLoginIp!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FAN,
  })
  role!: UserRole;

  // =========================
  // PROFILE DETAILS
  // =========================
  
  // FIX: Ensure TypeScript knows this can be null
  // This field should hold the FULL Cloudinary URL
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  // =========================
  // KYC
  // =========================
  @Column({ nullable: true })
  fullName!: string | null;

  @Column({ name: 'id_card_url', nullable: true })
  idCardUrl!: string | null;

  @Column({ name: 'verification_video_url', nullable: true })
  verificationVideoUrl!: string | null;

  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.NONE,
  })
  kycStatus!: KYCStatus;

  // =========================
  // SOCIAL STATS
  // =========================
  @Column({ name: 'followers_count', default: 0 })
  followersCount!: number;

  @Column({ name: 'following_count', default: 0 })
  followingCount!: number;

  // =========================
  // RELATIONSHIPS
  // =========================
  // Note: Loading relationships (followers/following) automatically 
  // can cause performance issues (N+1 queries). 
  // Ideally, keep these lazy or handle them in DTOs.
  @ManyToMany(() => User, (user) => user.following)
  followers!: User[];

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'user_follows',
    joinColumn: { name: 'followerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'followingId', referencedColumnName: 'id' },
  })
  following!: User[];

  // =========================
  // WALLET
  // =========================
  @Column({ name: 'coin_balance', type: 'int', default: 0 })
  coinBalance!: number;

  // =========================
  // DATES
  // =========================
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}