import { useRef, useState } from 'react';
import { Panel, ServerTable, MutationDialog, History, Status } from './Shared';
import { dateLabel, shortWallet } from './hooks';
import { PlacementDialog } from './placements/PlacementForms';
import { TopicCreator, TopicsPanel } from './placements/Topics';
import { BatchRegistrationAction, BatchRegistrationsPanel } from './placements/Registrations';
export { TopicsPanel };
export default function PlacementsPage({ user, unified = false }) {
  const [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null);
  const [createdTopic, setCreatedTopic] = useState(null),
    topicList = useRef(null);
  const closeAndRefresh = () => {
    setModal(null);
    setRevision((n) => n + 1);
  };
  const topicSaved = (topic) => {
    setCreatedTopic(topic);
    setRevision((n) => n + 1);
    topicList.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className="business-stack">
      {unified && user.role === 'company' && <TopicCreator onSaved={topicSaved} />}
      {unified && ['company', 'admin'].includes(user.role) && (
        <div ref={topicList}>
          <TopicsPanel
            user={user}
            revision={revision}
            createdTopic={createdTopic}
            onChanged={() => {
              setCreatedTopic(null);
              setRevision((n) => n + 1);
            }}
          />
        </div>
      )}
      <Panel
        title="Đợt / kỳ thực tập"
        description="Nhà trường quản lý kỳ; không thể đóng kỳ còn phân công chưa kết thúc."
        actions={
          user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setModal({ type: 'batch' })}>
              Tạo kỳ thực tập
            </button>
          )
        }
      >
        <ServerTable
          path="/core/batches"
          revision={revision}
          label="Kỳ thực tập"
          columns={[
            { key: 'code', title: 'Mã kỳ' },
            { key: 'name', title: 'Tên kỳ' },
            {
              key: 'dates',
              title: 'Thời gian',
              render: (r) => (
                <span>
                  {dateLabel(r.startDate)} → {dateLabel(r.endDate)}
                </span>
              ),
            },
            { key: 'status', title: 'Trạng thái', render: (r) => <Status value={r.status} /> },
            {
              key: 'action',
              title: 'Thao tác',
              render: (r) =>
                user.role === 'admin' ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModal({ type: 'batch', data: r })}
                  >
                    Sửa kỳ / trạng thái
                  </button>
                ) : unified && user.role === 'student' ? (
                  <BatchRegistrationAction batch={r} onChanged={closeAndRefresh} />
                ) : (
                  <span>Chỉ xem</span>
                ),
            },
          ]}
        />
      </Panel>
      {unified && ['admin', 'student', 'company'].includes(user.role) && (
        <BatchRegistrationsPanel user={user} revision={revision} onChanged={closeAndRefresh} />
      )}
      <Panel
        title="Phân công theo kỳ"
        description="Theo dõi phân công từ đề xuất đến hoàn tất."
        actions={
          ['admin', 'company'].includes(user.role) && (
            <button className="btn btn-primary" onClick={() => setModal({ type: 'placement' })}>
              {unified && user.role === 'admin' ? 'Phân công sinh viên' : 'Đề xuất phân công'}
            </button>
          )
        }
      >
        <ServerTable
          path="/core/placements"
          revision={revision}
          label="Phân công"
          search={false}
          columns={[
            {
              key: 'topic',
              title: 'Đề tài / tiêu chí',
              render: (r) => (
                <div>
                  <strong>{r.topic?.title || r.topicId}</strong>
                  <details>
                    <summary>Tiêu chí KPI</summary>
                    {r.topic?.kpis?.map((k, i) => (
                      <p key={i}>
                        {k.title} · {k.weightPercent}% · {k.description}
                      </p>
                    ))}
                  </details>
                  <small className="muted">ID: {r._id}</small>
                </div>
              ),
            },
            {
              key: 'people',
              title: 'Thành viên',
              render: (r) => (
                <div>
                  SV: {r.participantNames?.student || shortWallet(r.studentWallet)}
                  <br />
                  DN: {r.participantNames?.company || shortWallet(r.companyWallet)}
                  <br />
                  GV: {r.participantNames?.mentor || shortWallet(r.mentorWallet)}
                </div>
              ),
            },
            {
              key: 'dates',
              title: 'Thời gian',
              render: (r) => (
                <span>
                  {dateLabel(r.startDate)}
                  <br />
                  {dateLabel(r.endDate)}
                </span>
              ),
            },
            {
              key: 'lifecycle',
              title: 'Trạng thái',
              render: (r) => (
                <>
                  <Status value={r.lifecycle} />
                  <History entries={r.history} />
                </>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              render: (r) => (
                <div className="business-actions">
                  {['admin', 'company'].includes(user.role) &&
                  !['completed', 'cancelled'].includes(r.lifecycle) ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setModal({ type: 'state', data: r })}
                    >
                      Cập nhật phân công
                    </button>
                  ) : (
                    <span>Chỉ xem</span>
                  )}
                  {user.role === 'admin' && ['proposed', 'approved'].includes(r.lifecycle) && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setModal({ type: 'details', data: r })}
                    >
                      Sửa giảng viên / ngày
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
      {modal && (
        <MutationDialog
          title={
            modal.type === 'batch'
              ? 'Kỳ thực tập'
              : modal.type === 'placement'
              ? unified && user.role === 'admin'
                ? 'Phân công sinh viên'
                : 'Đề xuất phân công'
              : 'Cập nhật phân công'
          }
          onClose={() => setModal(null)}
        >
          <PlacementDialog modal={modal} user={user} unified={unified} onSaved={closeAndRefresh} />
        </MutationDialog>
      )}
    </div>
  );
}
