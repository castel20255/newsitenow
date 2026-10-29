export function getUserFacingWithdrawalReason(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return reason.replace(/^Withdrawal auto-rejected:\s*/i, '');
}
