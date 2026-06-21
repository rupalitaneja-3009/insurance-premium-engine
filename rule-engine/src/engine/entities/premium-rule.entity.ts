import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RuleType {
  AGE = 'AGE',
  BMI = 'BMI',
  DISEASE = 'DISEASE',
  CITY = 'CITY',
  SMOKER = 'SMOKER',
  NCB = 'NCB',
  FAMILY = 'FAMILY',
  TENURE = 'TENURE',
}

@Entity('premium_rules')
export class PremiumRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RuleType })
  ruleType: RuleType;

  @Column({ type: 'jsonb' })
  condition: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  factor: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  loading: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  discount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
