import { useState } from 'react';
import { apiRequest, setToken } from '../api/client';
export default function EmailIdentity({ register, onSession }) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await apiRequest('/auth/email/' + (register ? 'register' : 'login'), {
        method: 'POST',
        body: { email, password, ...(register ? { name, confirmPassword: confirm } : {}) },
      });
      setToken(r.token);
      await onSession(r);
    } catch (e) {
      setError(
        e.status === 404
          ? 'Đăng nhập email hiện chưa khả dụng. Vui lòng liên hệ quản trị viên.'
          : e.message
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="identity-credentials"
      onSubmit={submit}
      aria-label={register ? 'Đăng ký email' : 'Đăng nhập email'}
    >
      {register && (
        <label>
          Họ tên
          <input
            aria-label="Họ tên đăng ký"
            autoComplete="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}

      <label>
        Email
        <input
          aria-label="Email đăng nhập"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ten@gmail.com"
        />
      </label>
      <label>
        Mật khẩu
        <input
          aria-label="Mật khẩu Internova"
          type="password"
          autoComplete={register ? 'new-password' : 'current-password'}
          aria-describedby={register ? 'register-password-hint' : undefined}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {register && (
        <label>
          Nhập lại mật khẩu
          <input
            aria-label="Nhập lại mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
      )}
      {register && (
        <small id="register-password-hint" className="muted">
          Ít nhất 8 ký tự. Tối đa 72 byte khi mã hóa.
        </small>
      )}
      {error && (
        <p role="alert" className="inline-alert is-error">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'}
      </button>
    </form>
  );
}
export {default as PasswordSettings} from './PasswordSettings';
