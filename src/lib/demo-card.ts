export function cardBrand(value: string): "Visa" | "Mastercard" | null {
  const n = value.replace(/\D/g, "");
  if (n.startsWith("4")) return "Visa";
  const prefix = Number(n.slice(0, 4));
  if (/^5[1-5]/.test(n) || (n.length >= 4 && prefix >= 2221 && prefix <= 2720)) return "Mastercard";
  return null;
}
export function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
export function cardError(number: string, expiry: string, cvv: string, now = new Date()) {
  const digits = number.replace(/\s/g, "");
  const brand = cardBrand(digits);
  if (
    !/^\d+$/.test(digits) ||
    !brand ||
    !(brand === "Visa" ? [13, 16, 19] : [16]).includes(digits.length)
  )
    return "Enter a valid Visa or Mastercard number.";
  let sum = 0;
  [...digits].reverse().forEach((n, i) => {
    let d = Number(n);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  });
  if (sum % 10 !== 0) return "Check your card number: its digits do not pass the checksum.";
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry);
  if (!match) return "Enter the expiry as MM/YY.";
  const month = Number(match[1]),
    year = 2000 + Number(match[2]);
  if (
    month < 1 ||
    month > 12 ||
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1)
  )
    return "Enter a valid expiry date that has not passed.";
  if (!/^\d{3}$/.test(cvv)) return "Enter a three-digit CVV.";
  return "";
}
