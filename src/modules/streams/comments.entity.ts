import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' }) // Explicitly define as UUID for DB consistency
  sessionId: string; 

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  username: string;

  // FIX: Use 'text' type to allow long messages without character limits
  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'TEXT' })
  type: 'TEXT' | 'GIFT'; 

  @CreateDateColumn()
  createdAt: Date;
}