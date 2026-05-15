import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string; 

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column()
  message: string;

  @Column({ default: 'TEXT' })
  type: 'TEXT' | 'GIFT'; 

  @CreateDateColumn()
  createdAt: Date;
}