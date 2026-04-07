export function numberToArabicWords(number: number): string {
  if (number === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'آلاف', 'آلاف', 'آلاف', 'آلاف', 'آلاف', 'آلاف', 'آلاف'];
  const millions = ['', 'مليون', 'مليونان', 'ملايين', 'ملايين', 'ملايين', 'ملايين', 'ملايين', 'ملايين', 'ملايين'];

  function convertGroup(n: number): string {
    let text = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) text += hundreds[h] + ' و';
    
    if (t === 1 && o > 0) {
      if (o === 1) text += 'أحد عشر و';
      else if (o === 2) text += 'اثنا عشر و';
      else text += ones[o] + ' عشر و';
    } else {
      if (o > 0) text += ones[o] + ' و';
      if (t > 0) text += tens[t] + ' و';
    }
    
    return text.replace(/ و$/, '');
  }

  let result = '';
  const m = Math.floor(number / 1000000);
  const th = Math.floor((number % 1000000) / 1000);
  const rem = number % 1000;

  if (m > 0) {
    if (m === 1) result += 'مليون و';
    else if (m === 2) result += 'مليونان و';
    else if (m >= 3 && m <= 10) result += convertGroup(m) + ' ملايين و';
    else result += convertGroup(m) + ' مليون و';
  }

  if (th > 0) {
    if (th === 1) result += 'ألف و';
    else if (th === 2) result += 'ألفان و';
    else if (th >= 3 && th <= 10) result += convertGroup(th) + ' آلاف و';
    else result += convertGroup(th) + ' ألف و';
  }

  if (rem > 0) {
    result += convertGroup(rem);
  }

  result = result.replace(/ و$/, '').trim();
  return result + ' ريال سعودي';
}
