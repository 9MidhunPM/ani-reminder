export function LoadingState({ label, rows = 3 }: { label: string; rows?: number }) {
  return <div className="loading-state" role="status" aria-live="polite"><p>{label}</p><div aria-hidden="true">{Array.from({ length: rows }, (_, index) => <div key={index} className="loading-row"><span /><div><i /><i /></div></div>)}</div></div>;
}
