export function calculateElo(a: number, b: number, scoreA: number, scoreB: number, k = 32) {
  const ea = 1 / (1 + Math.pow(10, (b - a) / 400))
  const eb = 1 / (1 + Math.pow(10, (a - b) / 400))
  const ra = a + k * (scoreA - ea)
  const rb = b + k * (scoreB - eb)
  return { ra: Math.round(ra), rb: Math.round(rb) }
}
