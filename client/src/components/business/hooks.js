import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

export function useResource(path, revision = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setState(current => ({ ...current, loading: true, error: '' }));
      return apiRequest(path).then(data => { if (active) setState({ data, loading: false, error: '' }); }).catch(error => { if (active) setState({ data: null, loading: false, error: error.message }); });
    });
    return () => { active = false; };
  }, [path, revision]);
  return state;
}
export const dateLabel = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';
export const shortWallet = value => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '—';
export function localInput(value) { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
export const asIso = value => new Date(value).toISOString();
export const active = assignment => assignment?.lifecycle === 'active' && Date.parse(assignment.startDate) <= Date.now() && Date.parse(assignment.endDate) >= Date.now();
