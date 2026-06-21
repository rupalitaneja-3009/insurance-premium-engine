export interface AddonInput {
  code: string;
  annualPremium: number;
  name: string;
}

export function calculateAddonsPremium(addons: AddonInput[]) {
  if (!addons || addons.length === 0) {
    return { totalAddonPremium: 0, breakdown: [] };
  }

  const breakdown = addons.map((addon) => ({
    code: addon.code,
    name: addon.name,
    premium: Number(addon.annualPremium),
  }));

  const totalAddonPremium = breakdown.reduce((sum, a) => sum + a.premium, 0);

  return { totalAddonPremium, breakdown };
}
