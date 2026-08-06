// spec §6.5 / MoCRA §607.32: minimum retention is 6 years from production date.
export function calculateRetentionDeadline(productionDate: Date): Date {
  const deadline = new Date(productionDate)
  deadline.setFullYear(deadline.getFullYear() + 6)
  return deadline
}
