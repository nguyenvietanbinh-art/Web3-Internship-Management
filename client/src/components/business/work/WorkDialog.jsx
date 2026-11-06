import { TaskForm, TaskSubmitForm, TaskReviewForm } from './TaskForms';
import { LogForm, LogReview } from './WorkLogForms';

export default function WorkDialog({ modal, user, assignment, onAssignment, onSaved }) {
  const shared = { data: modal.data, onSaved };
  switch (modal.type) {
    case 'submitTask':
      return <TaskSubmitForm {...shared} />;
    case 'reviewTask':
      return <TaskReviewForm {...shared} />;
    case 'task':
      return (
        <TaskForm {...shared} user={user} assignment={assignment} onAssignment={onAssignment} />
      );
    case 'log':
      return <LogForm {...shared} assignment={assignment} />;
    default:
      return <LogReview {...shared} />;
  }
}
