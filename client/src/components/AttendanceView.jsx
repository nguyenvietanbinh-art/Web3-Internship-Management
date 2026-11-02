import { Dialog, EmptyState, LoadingSkeleton } from './ui';
import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Clock,
  BookOpen,
  PlusCircle,
  ListTodo
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function AttendanceView({ user, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'tasks' | 'worklogs'
  const [qrData, setQrData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrForm, setQrForm] = useState({ studentWallet: '', topicId: '' });

  // Modals
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateLogModal, setShowCreateLogModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedStudentWallet: '' });
  const [logForm, setLogForm] = useState({ weekNumber: 1, title: '', tasksDone: '', challenges: '', nextPlan: '' });

  const fetchData = useCallback(async () => {
    if (!user) { setError('Đăng nhập để xem dữ liệu điểm danh/công việc.'); setAttendanceHistory([]); setTasks([]); setWorkLogs([]); setQrData(null); return; }
    setError('');
    try {
      const [qrRes, attRes, tasksRes, logsRes] = await Promise.all([
        user.role === 'company' ? apiRequest('/internship/attendance/today-qr').catch(err => { if (err.status === 404) return null; throw err; }) : Promise.resolve(null),
        apiRequest('/internship/attendance/history'),
        apiRequest('/internship/tasks'),
        apiRequest('/internship/worklogs'),
      ]);
      setQrData(qrRes);
      setAttendanceHistory(attRes);
      setTasks(tasksRes);
      setWorkLogs(logsRes);
    } catch (err) {
      setError(err.message); setAttendanceHistory([]); setTasks([]); setWorkLogs([]); setQrData(null);
    } finally { setInitialLoading(false); }
  }, [user]);

  useEffect(() => { const timer = setTimeout(() => { void fetchData(); }, 0); return () => clearTimeout(timer); }, [fetchData]);

  // Student Check-in action
  const handleStudentCheckIn = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/internship/attendance/check-in', {
        method: 'POST',
        body: { qrCodeHash: qrToken.trim() },
      });
      showToast(res.message || 'Điểm danh thành công!');
      await fetchData();
    } catch (err) {
      showToast(`Không thể điểm danh: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Change task status
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await apiRequest(`/internship/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      showToast('Đã cập nhật tiến độ nhiệm vụ!');
    } catch (err) {
      showToast(`Lỗi cập nhật: ${err.message}`);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/internship/tasks', { method: 'POST', body: taskForm });
      setTasks([res.task, ...tasks]);
      setShowCreateTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignedStudentWallet: '' });
      showToast('Đã thêm nhiệm vụ mới!');
    } catch (err) {
      showToast(`Không thể tạo nhiệm vụ: ${err.message}`);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/internship/worklogs', { method: 'POST', body: logForm });
      setWorkLogs([res.workLog, ...workLogs]);
      setShowCreateLogModal(false);
      setLogForm({ weekNumber: 1, title: '', tasksDone: '', challenges: '', nextPlan: '' });
      showToast('Đã gửi nhật ký thực tập!');
    } catch (err) {
      showToast(`Không thể gửi nhật ký: ${err.message}`);
    }
  };

  const createQrSession = async (event) => {
    event.preventDefault(); setLoading(true);
    try { setQrData(await apiRequest('/internship/attendance/sessions', { method: 'POST', body: qrForm })); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <EmptyState error title="Không tải được dữ liệu" action={<button className="btn btn-secondary" onClick={fetchData}>Thử lại</button>}>{error}</EmptyState>}
      {initialLoading && <LoadingSkeleton />}
      {/* Sub Tabs Toggle */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
        <button
          aria-pressed={activeSubTab === 'attendance'}
          onClick={() => setActiveSubTab('attendance')}
          className="btn"
          style={{
            background: activeSubTab === 'attendance' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'attendance' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <QrCode size={16} /> QR Check-in & Chấm Công
        </button>
        <button
          aria-pressed={activeSubTab === 'tasks'}
          onClick={() => setActiveSubTab('tasks')}
          className="btn"
          style={{
            background: activeSubTab === 'tasks' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'tasks' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <ListTodo size={16} /> Nhiệm Vụ Hàng Ngày ({tasks.length})
        </button>
        <button
          aria-pressed={activeSubTab === 'worklogs'}
          onClick={() => setActiveSubTab('worklogs')}
          className="btn"
          style={{
            background: activeSubTab === 'worklogs' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'worklogs' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <BookOpen size={16} /> Nhật Ký Thực Tập ({workLogs.length})
        </button>
      </div>

      {/* SubTab 1: ATTENDANCE & QR CHECK-IN */}
      {activeSubTab === 'attendance' && (
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
          {/* QR Display Card */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={20} color="var(--primary-light)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Mã QR Điểm Danh Hôm Nay</h4>
            </div>

            <p style={{ fontSize: '0.85rem' }}>Phiên có thời hạn cho sinh viên được phân công. Luồng này chưa xác minh camera, GPS hoặc blockchain; ngày điểm danh theo UTC.</p>
            {user?.role === 'company' && <form onSubmit={createQrSession} style={{ width: '100%', display: 'grid', gap: 8 }}>
              <label>Ví sinh viên<input className="input-field" aria-label="Ví sinh viên của phiên QR" required value={qrForm.studentWallet} onChange={e => setQrForm({ ...qrForm, studentWallet: e.target.value })} /></label>
              <label>ID đề tài<input className="input-field" aria-label="ID đề tài của phiên QR" required value={qrForm.topicId} onChange={e => setQrForm({ ...qrForm, topicId: e.target.value })} /></label>
              <button className="btn btn-primary" disabled={loading}>Tạo phiên có hạn</button>
            </form>}
            {qrData && user?.role === 'company' && <div style={{ width: '100%' }}>
              <label>Mã phiên để chia sẻ với sinh viên<textarea className="input-field" aria-label="Mã phiên đã ký" readOnly value={qrData.hash} rows={4} /></label>
              <p>Hết hạn: {new Date(qrData.validUntil).toLocaleString()}</p>
            </div>}
            {user?.role === 'student' && <>
              <label style={{ width: '100%' }}>Mã phiên được công ty cấp<textarea className="input-field" aria-label="Mã phiên điểm danh" value={qrToken} onChange={e => setQrToken(e.target.value)} rows={4} /></label>
              <button id="student-checkin-btn" className="btn btn-emerald" disabled={loading || !qrToken.trim()} onClick={handleStudentCheckIn}>
                {loading ? 'Đang xác thực...' : 'Xác thực mã phiên điểm danh'}
              </button>
            </>}
          </div>

          {/* Attendance History Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0' }}>Lịch Sử Điểm Danh Thực Tập</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>NGÀY</th>
                    <th style={{ padding: '10px 12px' }}>THỜI GIAN VÀO</th>
                    <th style={{ padding: '10px 12px' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '10px 12px' }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.length === 0 && <tr><td colSpan={4}><EmptyState title="Chưa có lịch sử điểm danh" /></td></tr>}
                  {attendanceHistory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{item.date}</td>
                      <td style={{ padding: '12px', color: 'var(--accent-cyan)' }}>
                        {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : 'Chưa ghi nhận'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${item.status === 'on_time' ? 'badge-completed' : 'badge-in_progress'}`}>
                          {item.status === 'on_time' ? 'Đúng Giờ' : 'Đi Muộn'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: TASKS KANBAN */}
      {activeSubTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Bảng Nhiệm Vụ Sinh Viên</h4>
            <button className="btn btn-primary" disabled={user?.role !== 'company'} onClick={() => setShowCreateTaskModal(true)} style={{ fontSize: '0.82rem' }}>
              <PlusCircle size={16} /> Giao Nhiệm Vụ Mới
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {!initialLoading && !error && tasks.length === 0 && <EmptyState title="Chưa có nhiệm vụ" />}
            {tasks.map((task) => (
              <div key={task._id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`badge ${task.priority === 'urgent' ? 'badge-rejected' : task.priority === 'high' ? 'badge-in_progress' : 'badge-open'}`}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h5 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>{task.title}</h5>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{task.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Trạng thái: <strong style={{ color: task.status === 'done' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{task.status.toUpperCase()}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {task.status !== 'done' && (
                      <button className="btn btn-emerald" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => handleTaskStatusChange(task._id, 'done')}>
                        Xong ✓
                      </button>
                    )}
                    {task.status === 'todo' && (
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => handleTaskStatusChange(task._id, 'in_progress')}>
                        Làm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: WORK LOGS */}
      {activeSubTab === 'worklogs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Nhật Ký Báo Cáo Tuần Của Sinh Viên</h4>
            <button className="btn btn-emerald" disabled={user?.role !== 'student'} onClick={() => setShowCreateLogModal(true)} style={{ fontSize: '0.82rem' }}>
              <PlusCircle size={16} /> Viết Nhật Ký Mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!initialLoading && !error && workLogs.length === 0 && <EmptyState title="Chưa có nhật ký" />}
            {workLogs.map((log) => (
              <div key={log._id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-open">Tuần {log.weekNumber}</span>
                    <h5 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{log.title}</h5>
                  </div>
                  <span className={`badge ${log.status === 'approved' ? 'badge-completed' : 'badge-in_progress'}`}>
                    {log.status === 'approved' ? 'Mentor Đã Duyệt' : 'Chờ Phản Hồi'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--surface-muted)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--primary-light)', fontWeight: 600, marginBottom: '4px' }}>Nội dung công việc hoàn thành:</div>
                  <p style={{ margin: '0 0 8px 0' }}>{log.tasksDone}</p>
                  {log.challenges && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>
                      <strong>Khó khăn gặp phải:</strong> {log.challenges}
                    </div>
                  )}
                </div>

                {log.mentorFeedback && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent-emerald)' }}>
                    <strong>Nhận xét của Mentor:</strong> "{log.mentorFeedback}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showCreateTaskModal && (
        <Dialog label="Giao nhiệm vụ" onClose={() => setShowCreateTaskModal(false)}>
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Giao Nhiệm Vụ Mới</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label>Ví sinh viên được phân công<input className="input-field" aria-label="Ví nhận nhiệm vụ" required pattern="0x[a-fA-F0-9]{40}" value={taskForm.assignedStudentWallet} onChange={e => setTaskForm({ ...taskForm, assignedStudentWallet: e.target.value })} /></label>
              <input aria-label="Tiêu đề nhiệm vụ..." className="input-field" placeholder="Tiêu đề nhiệm vụ..." required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              <textarea aria-label="Mô tả chi tiết yêu cầu..." className="input-field" rows={3} placeholder="Mô tả chi tiết yêu cầu..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              <select aria-label="Độ ưu tiên" className="input-field" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Độ ưu tiên: Thấp</option>
                <option value="medium">Độ ưu tiên: Trung bình</option>
                <option value="high">Độ ưu tiên: Cao</option>
                <option value="urgent">Độ ưu tiên: Khẩn cấp</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTaskModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Nhiệm Vụ</button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Modal: Create Log */}
      {showCreateLogModal && (
        <Dialog label="Viết nhật ký" onClose={() => setShowCreateLogModal(false)}>
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Viết Báo Cáo Nhật Ký Tuần</h3>
            <form onSubmit={handleCreateLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input aria-label="Tuần số..." className="input-field" type="number" placeholder="Tuần số..." required value={logForm.weekNumber} onChange={e => setLogForm({ ...logForm, weekNumber: e.target.value })} />
              <input aria-label="Tiêu đề báo cáo tuần..." className="input-field" placeholder="Tiêu đề báo cáo tuần..." required value={logForm.title} onChange={e => setLogForm({ ...logForm, title: e.target.value })} />
              <textarea aria-label="Các công việc đã hoàn thành..." className="input-field" rows={3} placeholder="Các công việc đã hoàn thành..." required value={logForm.tasksDone} onChange={e => setLogForm({ ...logForm, tasksDone: e.target.value })} />
              <textarea aria-label="Khó khăn gặp phải (nếu có)..." className="input-field" rows={2} placeholder="Khó khăn gặp phải (nếu có)..." value={logForm.challenges} onChange={e => setLogForm({ ...logForm, challenges: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateLogModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-emerald">Gửi Nhật Ký</button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}
