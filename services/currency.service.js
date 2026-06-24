const CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', locale: 'de-CH' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  DKK: { symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' }
};

function getCurrencyInfo(code) {
  return CURRENCIES[code?.toUpperCase()] || { symbol: code || '', name: code || 'Unknown', locale: 'en-US' };
}

function formatPrice(amount, currency = 'EUR') {
  const info = getCurrencyInfo(currency);
  return (amount / 100).toLocaleString(info.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
}

function getCurrencySymbol(code) {
  return getCurrencyInfo(code).symbol;
}

function getAllCurrencies() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({ code, ...info }));
}

module.exports = { getCurrencyInfo, formatPrice, getCurrencySymbol, getAllCurrencies, CURRENCIES };
