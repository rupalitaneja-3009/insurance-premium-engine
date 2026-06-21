export function applyBmiRule(bmi: number) {
  let factor = 1.0;
  let description = '';

  if (bmi < 18.5) {
    factor = 1.1;
    description = 'Underweight BMI: +10% loading';
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    factor = 1.0;
    description = 'Normal BMI: Standard rate';
  } else if (bmi >= 25 && bmi <= 29.9) {
    factor = 1.1;
    description = 'Overweight BMI: +10% loading';
  } else if (bmi >= 30 && bmi <= 34.9) {
    factor = 1.25;
    description = 'Obese BMI: +25% loading';
  } else if (bmi >= 35) {
    factor = 1.5;
    description = 'Severely Obese BMI: +50% loading';
  }

  return { factor, loading: 0, discount: 0, description };
}
