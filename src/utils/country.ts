export const countryNamesMap: Record<string, string> = {
  US: 'США',
  GB: 'Великобритания',
  JP: 'Япония',
  KR: 'Южная Корея',
  RU: 'Россия',
  FR: 'Франция',
  DE: 'Германия',
  ES: 'Испания',
  IT: 'Италия',
  CA: 'Канада',
  AU: 'Австралия',
  CN: 'Китай',
  IN: 'Индия',
  BR: 'Бразилия',
  MX: 'Мексика',
  SE: 'Швеция',
  NO: 'Норвегия',
  DK: 'Дания',
  FI: 'Финляндия',
  PL: 'Польша',
  UA: 'Украина',
  BY: 'Беларусь',
  KZ: 'Казахстан',
};

export const getCountryName = (codeOrName?: string): string => {
  if (!codeOrName) return 'США';
  const clean = codeOrName.trim().toUpperCase();
  if (countryNamesMap[clean]) return countryNamesMap[clean];
  return codeOrName;
};
