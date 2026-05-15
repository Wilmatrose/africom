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

  @Column({
    unique: true,
  })
  username!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column({
    name: 'password_hash',
  })
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
  
  @Column({
    name: 'avatar_url',
    nullable: true,
  })
  avatarUrl!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio!: string;

  // =========================
  // KYC
  // =========================
  @Column({
    nullable: true,
  })
  fullName!: string;

  @Column({
    name: 'id_card_url',
    nullable: true,
  })
  idCardUrl!: string;

  @Column({
    name: 'verification_video_url',
    nullable: true,
  })
  verificationVideoUrl!: string;

  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.NONE,
  })
  kycStatus!: KYCStatus;

  // =========================
  // SOCIAL STATS (CACHED)
  // These columns are useful for quick display without joining tables.
  // You should manually increment/decrement these in the service when following/unfollowing.
  // =========================
  @Column({
    name: 'followers_count',
    default: 0,
  })
  followersCount!: number;

  @Column({
    name: 'following_count',
    default: 0,
  })
  followingCount!: number;

  // =========================
  // RELATIONSHIPS (FOLLOW SYSTEM)
  // =========================

  /**
   * Users who follow this user.
   * Inverse side of 'following'.
   */
  @ManyToMany(() => User, (user) => user.following)
  followers!: User[];

  /**
   * Users that this user follows.
   * Owner of the relationship (has JoinTable).
   */
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'user_follows', // Name of the junction table
    joinColumn: {
      name: 'followerId', // The ID of the user who is following
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId', // The ID of the user being followed
      referencedColumnName: 'id',
    },
  })
  following!: User[];

  // =========================
  // WALLET
  // =========================
  @Column({
    name: 'coin_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  coinBalance!: number;

  // =========================
  // TRACKING
  // =========================
  @Column({
    name: 'last_login_ip',
    type: 'varchar',
    nullable: true,
  })
  lastLoginIp!: string | null;

  // =========================
  // DATES
  // =========================
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}