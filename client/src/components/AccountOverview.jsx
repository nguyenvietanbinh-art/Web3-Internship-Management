import {roleNames} from './navigation';
export default function AccountOverview({user,onEdit}){
 return <section className="glass-panel business-panel" data-testid="account-overview"><div className="section-heading"><div><h2>Thông tin tài khoản</h2></div></div><dl className="business-stack"><div><dt>Họ tên</dt><dd>{user.name}</dd></div><div><dt>Email hồ sơ</dt><dd>{user.email||'Chưa bổ sung'}</dd></div><div><dt>Vai trò</dt><dd>{roleNames[user.role]||user.role}</dd></div><div><dt>Kỹ năng</dt><dd>{user.skills?.length?user.skills.join(', '):'Chưa bổ sung'}</dd></div><div><dt>Giới thiệu</dt><dd style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{user.bio||'Chưa bổ sung'}</dd></div></dl><button className="btn btn-secondary" onClick={onEdit}>Chỉnh sửa hồ sơ</button></section>;
}
