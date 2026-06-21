export interface AgeRuleInput {
  age: number;
}

export interface RuleResult {
  factor: number;
  loading: number;
  discount: number;
  description: string;
}

export function applyAgeRule(age: number): RuleResult {
  let factor = 1.0;
  let description = '';

  if (age >= 18 && age <= 25) {
    factor = 1.0;
    description = 'Age 18-25: Standard rate';
  } else if (age >= 26 && age <= 35) {
    factor = 1.2;
    description = 'Age 26-35: +20% loading';
  } else if (age >= 36 && age <= 45) {
    factor = 1.5;
    description = 'Age 36-45: +50% loading';
  } else if (age >= 46 && age <= 55) {
    factor = 2.0;
    description = 'Age 46-55: +100% loading';
  } else if (age >= 56 && age <= 65) {
    factor = 2.8;
    description = 'Age 56-65: +180% loading';
  } else if (age > 65) {
    factor = 3.5;
    description = 'Age 65+: +250% loading (Senior)';
  }

  return { factor, loading: 0, discount: 0, description };
}
