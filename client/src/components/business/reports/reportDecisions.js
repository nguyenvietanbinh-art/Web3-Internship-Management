export const REPORT_DECISIONS = [
  { value: 'approved', label: 'Đồng ý' },
  { value: 'need_revision', label: 'Cần chỉnh sửa lại' },
  { value: 'incorrect', label: 'Sai' },
];

export const REPORT_DECISION_LABELS = Object.fromEntries(
  REPORT_DECISIONS.map(({ value, label }) => [value, label])
);
