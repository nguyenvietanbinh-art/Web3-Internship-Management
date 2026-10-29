import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  BookOpen, 
  PlusCircle, 
  ListTodo, 
  AlertCircle, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function AttendanceView({ user, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'tasks' | 'worklogs'
  const [qrData, setQrData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateLogModal, setShowCreateLogModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });
  const [logForm, setLogForm] = useState({ weekNumber: 3, title: '', tasksDone: '', challenges: '', nextPlan: '' });

  const fetchData = async () => {
    try {
      const [qrRes, attRes, tasksRes, logsRes] = await Promise.all([
        apiRequest('/internship/attendance/today-qr'),
        apiRequest('/internship/attendance/history'),
        apiRequest('/internship/tasks'),
        apiRequest('/internship/worklogs'),
      ]);
      setQrData(qrRes);
      setAttendanceHistory(attRes);
      setTasks(tasksRes);
      setWorkLogs(logsRes);
    } catch (err) {
      console.error("Fetch attendance data error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Student Check-in action
  const handleStudentCheckIn = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/internship/attendance/check-in', {
        method: 'POST',
        body: { qrCodeHash: qrData?.hash || 'QR-VERIFIED' },
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
      setTaskForm({ title: '', description: '', priority: 'medium' });
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
      setLogForm({ weekNumber: 4, title: '', tasksDone: '', challenges: '', nextPlan: '' });
      showToast('Đã gửi nhật ký thực tập!');
    } catch (err) {
      showToast(`Không thể gửi nhật ký: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs Toggle */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className="btn"
          style={{
            background: activeSubTab === 'attendance' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'attendance' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <QrCode size={16} /> QR Check-in & Chấm Công
        </button>
        <button
          onClick={() => setActiveSubTab('tasks')}
          className="btn"
          style={{
            background: activeSubTab === 'tasks' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'tasks' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <ListTodo size={16} /> Nhiệm Vụ Hàng Ngày ({tasks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('worklogs')}
          className="btn"
          style={{
            background: activeSubTab === 'worklogs' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'worklogs' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <BookOpen size={16} /> Nhật Ký Thực Tập ({workLogs.length})
        </button>
      </div>

      {/* SubTab 1: ATTENDANCE & QR CHECK-IN */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
          {/* QR Display Card */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={20} color="#818cf8" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Mã QR Điểm Danh Hôm Nay</h4>
            </div>

            {/* Simulated QR Code Graphic */}
            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
              display: 'inline-block',
              margin: '8px 0'
            }}>
              <div style={{
                width: '180px',
                height: '180px',
                background: 'repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
                borderRadius: '8px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: '1px solid #38bdf8'
                }}>
                  W3I-CHECKIN
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Phiên điểm danh: <span style={{ color: '#fff', fontWeight: 600 }}>{qrData?.session || 'HÔM NAY'}</span><br />
              Mã xác thực: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{qrData?.hash || 'SHA256-CODE'}</span>
            </div>

            <button
              id="student-checkin-btn"
              className="btn btn-emerald"
              disabled={loading}
              onClick={handleStudentCheckIn}
              style={{ width: '100%', padding: '12px' }}
            >
              <CheckCircle2 size={18} />
              {loading ? 'Đang xác thực...' : 'Quét QR Điểm Danh Ngay'}
            </button>
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
                  {attendanceHistory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{item.date}</td>
                      <td style={{ padding: '12px', color: '#38bdf8' }}>
                        {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '08:25:00'}
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
            <button className="btn btn-primary" onClick={() => setShowCreateTaskModal(true)} style={{ fontSize: '0.82rem' }}>
              <PlusCircle size={16} /> Giao Nhiệm Vụ Mới
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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
                    Trạng thái: <strong style={{ color: task.status === 'done' ? '#10b981' : '#f59e0b' }}>{task.status.toUpperCase()}</strong>
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
            <button className="btn btn-emerald" onClick={() => setShowCreateLogModal(true)} style={{ fontSize: '0.82rem' }}>
              <PlusCircle size={16} /> Viết Nhật Ký Mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: '4px' }}>Nội dung công việc hoàn thành:</div>
                  <p style={{ margin: '0 0 8px 0' }}>{log.tasksDone}</p>
                  {log.challenges && (
                    <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                      <strong>Khó khăn gặp phải:</strong> {log.challenges}
                    </div>
                  )}
                </div>

                {log.mentorFeedback && (
                  <div style={{ fontSize: '0.82rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Giao Nhiệm Vụ Mới</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input className="input-field" placeholder="Tiêu đề nhiệm vụ..." required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              <textarea className="input-field" rows={3} placeholder="Mô tả chi tiết yêu cầu..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              <select className="input-field" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
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
        </div>
      )}

      {/* Modal: Create Log */}
      {showCreateLogModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Viết Báo Cáo Nhật Ký Tuần</h3>
            <form onSubmit={handleCreateLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input className="input-field" type="number" placeholder="Tuần số..." required value={logForm.weekNumber} onChange={e => setLogForm({ ...logForm, weekNumber: e.target.value })} />
              <input className="input-field" placeholder="Tiêu đề báo cáo tuần..." required value={logForm.title} onChange={e => setLogForm({ ...logForm, title: e.target.value })} />
              <textarea className="input-field" rows={3} placeholder="Các công việc đã hoàn thành..." required value={logForm.tasksDone} onChange={e => setLogForm({ ...logForm, tasksDone: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Khó khăn gặp phải (nếu có)..." value={logForm.challenges} onChange={e => setLogForm({ ...logForm, challenges: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateLogModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-emerald">Gửi Nhật Ký</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
