import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Adjust path as needed

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // We keep the relations for easy loading of avatars/usernames
  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  receiver: User;

  // We also store raw IDs for easy querying (matches your Service logic)
  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  // Logic for Message Requests
  @Column({ default: false })
  isRequest: boolean;

  @Column({ default: false })
  isAccepted: boolean;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}