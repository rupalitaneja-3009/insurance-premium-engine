import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum PlanType {
  INDIVIDUAL = 'INDIVIDUAL',
  FAMILY_FLOATER = 'FAMILY_FLOATER',
  SENIOR_CITIZEN = 'SENIOR_CITIZEN',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PlanType, default: PlanType.INDIVIDUAL })
  type: PlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePremiumPer1L: number;

  @Column({ type: 'int' })
  minSumInsured: number;

  @Column({ type: 'int' })
  maxSumInsured: number;

  @Column({ type: 'int', default: 18 })
  minAge: number;

  @Column({ type: 'int', default: 65 })
  maxAge: number;

  @Column({ type: 'int', default: 1 })
  maxMembers: number;

  @Column({ type: 'jsonb', default: {} })
  coverageDetails: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  waitingPeriods: Record<string, unknown>[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
