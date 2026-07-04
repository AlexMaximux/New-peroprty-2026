import { BadgeCheck, Clock, AlertTriangle, XCircle } from 'lucide-react';

export type KycStatus = 'verified' | 'pending' | 'suspended' | 'rejected';

type StatusBadgeProps = {
  status: KycStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<KycStatus, { label: string; classes: string }> = {
    verified: {
      label: 'Verified',
      classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    pending: {
      label: 'Pending',
      classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
    },
    suspended: {
      label: 'Suspended',
      classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    },
    rejected: {
      label: 'Rejected',
      classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
  };

  const { label, classes } = map[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${classes}`}>
      {status === 'verified' && <BadgeCheck size={11} />}
      {status === 'pending' && <Clock size={11} />}
      {status === 'suspended' && <AlertTriangle size={11} />}
      {status === 'rejected' && <XCircle size={11} />}
      {label}
    </span>
  );
}