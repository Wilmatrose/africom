import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

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

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FAN,
  })
  role!: UserRole;

  // =========================
  // PROFILE DETAILS
  // =========================
  
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  // =========================
  // KYC
  // =========================
  @Column({ nullable: true })
  fullName!: string;

  @Column({ name: 'id_card_url', nullable: true })
  idCardUrl!: string;

  @Column({ name: 'verification_video_url', nullable: true })
  verificationVideoUrl!: string;

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
  // Changed to 'int' because we are dealing with whole Coins (100, 500, 1000)
  @Column({ name: 'coin_balance', type: 'int', default: 0 })
  coinBalance!: number;

  // =========================
  // TRACKING
  // =========================
  @Column({ name: 'last_login_ip', type: 'varchar', nullable: true })
  lastLoginIp!: string | null;

  // =========================
  // DATES
  // =========================
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}