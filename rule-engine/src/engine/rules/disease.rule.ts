export const DISEASE_LOADINGS: Record<string, number> = {
  DIABETES: 0.25,
  HYPERTENSION: 0.2,
  HEART_DISEASE: 0.4,
  CANCER: 0.5,
  KIDNEY_DISEASE: 0.35,
  LIVER_DISEASE: 0.3,
  ASTHMA: 0.15,
  THYROID: 0.1,
  ARTHRITIS: 0.1,
  DEPRESSION: 0.15,
};

export function applyDiseaseRule(diseases: string[]) {
  if (!diseases || diseases.length === 0) {
    return {
      factor: 1.0,
      loading: 0,
      discount: 0,
      description: 'No pre-existing conditions',
      breakdown: [],
    };
  }

  let totalLoading = 0;
  const breakdown: string[] = [];

  for (const disease of diseases) {
    const loading = DISEASE_LOADINGS[disease.toUpperCase()] || 0.1;
    totalLoading += loading;
    breakdown.push(`${disease}: +${(loading * 100).toFixed(0)}%`);
  }

  // Cap total loading at 100%
  totalLoading = Math.min(totalLoading, 1.0);

  return {
    factor: 1.0,
    loading: totalLoading,
    discount: 0,
    description: `Disease loading: ${breakdown.join(', ')}`,
    breakdown,
  };
}
