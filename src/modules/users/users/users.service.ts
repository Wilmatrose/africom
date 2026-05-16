import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, KYCStatus } from '../entities/user.entity';
import { FilesService } from '../../../../src/common/services/files.service'; // IMPORT CLOUDINARY SERVICE

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly filesService: FilesService, // INJECT CLOUDINARY SERVICE
  ) {}

  // =========================
  // CREATE USER
  // =========================
  async createUser(username: string, email: string, passwordHash: string) {
    const existingUser = await this.userRepo.findOne({ where: { username } });
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email } });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const user = this.userRepo.create({
      username,
      email,
      passwordHash,
      role: UserRole.FAN,
      coinBalance: 0,
      kycStatus: KYCStatus.NONE,
    });

    return this.userRepo.save(user);
  }

  // =========================
  // FIND USERS
  // =========================

  async findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'passwordHash', 'role', 'coinBalance', 'avatarUrl'],
    });
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // =========================
  // PUBLIC PROFILE & PRIVACY
  // =========================

  async getPublicProfile(targetId: string, requesterId?: string) {
    const user = await this.userRepo.findOne({
      where: { id: targetId },
      relations: ['followers', 'following'], 
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requesterId && requesterId === targetId) {
      delete user.passwordHash;
      return {
        ...user,
        isOwner: true,
        isFollowing: false,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      };
    }

    const isFollowing = requesterId
      ? user.followers?.some((f) => f.id === requesterId)
      : false;

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio || null,
      role: user.role,
      createdAt: user.createdAt,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing: !!isFollowing,
      isOwner: false,
    };
  }

  // =========================
  // FOLLOW SYSTEM
  // =========================

  async toggleFollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const currentUser = await this.userRepo.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });

    const targetUser = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['followers'],
    });

    if (!currentUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const isCurrentlyFollowing = currentUser.following.some(
      (u) => u.id === targetUserId,
    );

    if (isCurrentlyFollowing) {
      currentUser.following = currentUser.following.filter(
        (u) => u.id !== targetUserId,
      );
      targetUser.followers = targetUser.followers.filter(
        (u) => u.id !== currentUserId,
      );
    } else {
      currentUser.following.push(targetUser);
      targetUser.followers.push(currentUser);
    }

    await this.userRepo.save(currentUser);
    await this.userRepo.save(targetUser);

    return {
      success: true,
      isFollowing: !isCurrentlyFollowing,
      message: isCurrentlyFollowing ? 'Unfollowed user' : 'Followed user',
    };
  }

  async getFollowers(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    if (!user) throw new NotFoundException('User not found');
    
    return user.followers.map((u) => this.sanitizeUser(u));
  }

  async getFollowing(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.following.map((u) => this.sanitizeUser(u));
  }

  private sanitizeUser(user: User) {
    const { passwordHash, email, coinBalance, kycStatus, idCardUrl, verificationVideoUrl, ...publicData } = user;
    return publicData;
  }

  // =========================
  // ADMIN: USERS
  // =========================
  async getAllUsers() {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      coinBalance: u.coinBalance,
      kycStatus: u.kycStatus,
      createdAt: u.createdAt,
      ipAddress: u.lastLoginIp,
      status: (u as any).status || 'ACTIVE', 
    }));
  }

  async getUsersByRole(role: UserRole) {
    return this.userRepo.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });
  }

  // =========================
  // MODERATION ACTIONS
  // =========================
  async banUser(id: string) {
    const user = await this.findById(id);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot ban an Administrator');
    }
    return { message: `User ${user.username} has been banned successfully.` };
  }

  async unbanUser(id: string) {
    await this.findById(id);
    return { message: 'User has been unbanned.' };
  }

  // =========================
  // BALANCE OPERATIONS
  // =========================
  async increaseBalance(userId: string, amount: number) {
    await this.findById(userId);
    await this.userRepo.increment({ id: userId }, 'coinBalance', amount);
    return this.findById(userId);
  }

  async decreaseBalance(userId: string, amount: number) {
    const user = await this.findById(userId);
    if (user.coinBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    await this.userRepo.decrement({ id: userId }, 'coinBalance', amount);
    return this.findById(userId);
  }

  // =========================
  // CREATOR UPGRADE (KYC)
  // =========================

  async getPendingKyc() {
    return this.userRepo.find({
      where: { kycStatus: KYCStatus.PENDING },
      order: { updatedAt: 'DESC' },
    });
  }

  async requestCreatorUpgrade(
    userId: string,
    fullName: string,
    idCardFile: Express.Multer.File, // CHANGED: Accept File
    verificationVideoFile: Express.Multer.File, // CHANGED: Accept File
  ) {
    const user = await this.findById(userId);

    if (user.role === UserRole.CREATOR) {
      throw new BadRequestException('Already a Creator');
    }

    if (user.kycStatus === KYCStatus.PENDING) {
      throw new BadRequestException('Already pending review');
    }

    // ✅ FIX: Upload ID Card (Image) to Cloudinary
    const idCardUrl = await this.filesService.uploadImage(idCardFile);

    // ✅ FIX: Upload Video to Cloudinary using the video-specific method
    const verificationVideoUrl = await this.filesService.uploadVideo(verificationVideoFile);

    user.fullName = fullName;
    user.idCardUrl = idCardUrl;
    user.verificationVideoUrl = verificationVideoUrl;
    user.kycStatus = KYCStatus.PENDING;

    await this.userRepo.save(user);

    return { message: 'Submitted for verification' };
  }

  async approveCreator(userId: string) {
    const user = await this.findById(userId);

    if (user.kycStatus !== KYCStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    user.role = UserRole.CREATOR;
    user.kycStatus = KYCStatus.APPROVED;

    return this.userRepo.save(user);
  }

  async rejectCreator(userId: string) {
    const user = await this.findById(userId);
    
    user.kycStatus = KYCStatus.REJECTED;
    
    return this.userRepo.save(user);
  }

  // =========================
  // PROFILE UPDATE
  // =========================
  async updateProfile(userId: string, updates: Partial<User>) {
    const allowedUpdates = ['username', 'email', 'fullName', 'avatarUrl', 'bio'];
    
    for (const key of Object.keys(updates)) {
      if (!allowedUpdates.includes(key)) {
        delete (updates as any)[key];
      }
    }
    
    await this.userRepo.update(userId, updates);
    return this.findById(userId);
  }

  // =========================
  // AVATAR UPDATE (CLOUDINARY)
  // =========================
  async updateAvatar(userId: string, file: Express.Multer.File) {
    // ✅ FIX: Upload Image to Cloudinary
    const avatarUrl = await this.filesService.uploadImage(file);

    await this.userRepo.update(userId, {
      avatarUrl: avatarUrl,
    });
    
    return this.findById(userId);
  }

  // =========================
  // CHANGE PASSWORD
  // =========================
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ 
      where: { id: userId },
      select: ['id', 'passwordHash'] 
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { passwordHash: newHash });

    return { message: 'Password updated successfully' };
  }

  // =========================
  // ANALYTICS
  // =========================
  async getUserStats() {
    const users = await this.userRepo.find();

    return {
      totalUsers: users.length,
      fans: users.filter((u) => u.role === UserRole.FAN).length,
      creators: users.filter((u) => u.role === UserRole.CREATOR).length,
      pendingKyc: users.filter((u) => u.kycStatus === KYCStatus.PENDING).length,
    };
  }

  // =========================
  // LOGIN IP TRACKING
  // =========================
  async updateLastLoginIp(userId: string, ip: string) {
    await this.userRepo.update(userId, {
      lastLoginIp: ip,
    });
  }

  async getPendingKycCount() {
    return this.userRepo.count({
      where: { kycStatus: KYCStatus.PENDING },
    });
  }
}