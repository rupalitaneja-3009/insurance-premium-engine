import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  quoteId: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  planId: string;

  @Column()
  planCode: string;

  @Column()
  planName: string;

  @Column({ type: 'int' })
  sumInsured: number;

  @Column({ type: 'int', default: 1 })
  tenure: number;

  @Column()
  city: string;

  @Column({ type: 'int', default: 0 })
  ncbYears: number;

  @Column({ type: 'jsonb', default: [] })
  selectedAddons: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  members: Record<string, unknown>[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePremium: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  premiumBeforeGST: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gst: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPremium: number;

  @Column({ type: 'jsonb', default: {} })
  breakdown: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.ACTIVE,
  })
  status: QuoteStatus;

  @Column({ type: 'timestamp' })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
