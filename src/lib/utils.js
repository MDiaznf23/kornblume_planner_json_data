// Fungsi ini mereplikasi round(x, 1) Python secara presisi.
export function pythonRound1(x) {
  if (!Number.isFinite(x)) return x
  const neg = x < 0
  const ax = Math.abs(x)

  const s = ax.toFixed(20)
  const [ip, fp] = s.split('.')
  const d1 = fp.charCodeAt(0) - 48
  const remainder = fp.slice(1)
  const half = '5' + '0'.repeat(remainder.length - 1)
  const cmp = remainder < half ? -1 : remainder > half ? 1 : 0

  let roundUp
  if (cmp > 0) roundUp = true
  else if (cmp < 0) roundUp = false
  else roundUp = d1 % 2 === 1 // tie -> round to even

  let ipNum = BigInt(ip)
  let d1n = d1
  if (roundUp) d1n += 1
  if (d1n === 10) {
    ipNum += 1n
    d1n = 0
  }
  const result = Number(ipNum) + d1n / 10
  return neg && result !== 0 ? -result : result
}
