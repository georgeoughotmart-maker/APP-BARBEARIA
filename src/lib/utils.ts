export function fmtMoeda(v: number | string) {
  return 'R$ ' + parseFloat(v as string || '0').toFixed(2).replace('.', ',');
}

export function fmtData(d: string) {
  if (!d) return '';
  const [y, m, dia] = d.split('-');
  return `${dia}/${m}/${y}`;
}
