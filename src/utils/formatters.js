/**
 * Formata números para exibição compacta (1.2k, 1.5M, etc.)
 * @param {number} num - Número a ser formatado
 * @returns {string} - Número formatado
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }

  if (absNum >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }

  return num.toString();
};

/**
 * Formata números para exibição com separadores de milhares
 * @param {number} num - Número a ser formatado
 * @returns {string} - Número formatado com separadores
 */
export const formatNumberWithSeparators = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR').format(num);
};