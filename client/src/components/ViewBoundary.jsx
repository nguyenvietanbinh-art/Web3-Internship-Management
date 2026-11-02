import { Component } from 'react';
import { EmptyState } from './ui';

export default class ViewBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="glass-panel"><EmptyState error title="Không tải được màn hình" action={<button className="btn btn-secondary" onClick={() => window.location.reload()}>Tải lại trang</button>}>Kiểm tra kết nối rồi thử lại. Không có dữ liệu mẫu thay thế.</EmptyState></div> : this.props.children;
  }
}
