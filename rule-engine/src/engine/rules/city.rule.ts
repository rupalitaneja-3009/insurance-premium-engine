const METRO_CITIES = [
  'DELHI',
  'MUMBAI',
  'BANGALORE',
  'CHENNAI',
  'KOLKATA',
  'HYDERABAD',
  'PUNE',
  'AHMEDABAD',
];

const TIER1_CITIES = [
  'JAIPUR',
  'LUCKNOW',
  'KANPUR',
  'NAGPUR',
  'INDORE',
  'THANE',
  'BHOPAL',
  'VISAKHAPATNAM',
  'PIMPRI',
  'PATNA',
  'VADODARA',
  'GHAZIABAD',
  'LUDHIANA',
  'AGRA',
  'NASHIK',
  'FARIDABAD',
  'MEERUT',
  'RAJKOT',
  'GURUGRAM',
  'NOIDA',
];

export function getCityTier(city: string): string {
  const upperCity = city.toUpperCase();
  if (METRO_CITIES.includes(upperCity)) return 'METRO';
  if (TIER1_CITIES.includes(upperCity)) return 'TIER_1';
  return 'TIER_2';
}

export function applyCityRule(city: string) {
  const tier = getCityTier(city);
  let factor = 1.0;
  let description = '';

  switch (tier) {
    case 'METRO':
      factor = 1.2;
      description = `Metro city (${city}): +20% loading`;
      break;
    case 'TIER_1':
      factor = 1.1;
      description = `Tier 1 city (${city}): +10% loading`;
      break;
    default:
      factor = 1.0;
      description = `Tier 2/3 city (${city}): Standard rate`;
  }

  return { factor, loading: 0, discount: 0, description, tier };
}
