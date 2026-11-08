import {CriteriaConfigurationForm,TaskEvaluationPanel} from './TaskAssessment';
import { TaskForm, TaskSubmitForm, TaskReviewForm } from './TaskForms';
import { LogForm, LogReview, LogAssignmentForm } from './WorkLogForms';

export default function WorkDialog({ modal, user, assignment, onAssignment, onSaved, batchId='' }) {
  const shared = { user, data: modal.data, onSaved, batchId };
  switch (modal.type) {
    case 'criteria':return <CriteriaConfigurationForm {...shared}/>;
    case 'evaluation':return <TaskEvaluationPanel data={modal.data} user={user}/>;
    case 'assignLog':
      return <LogAssignmentForm {...shared} assignment={assignment} onAssignment={onAssignment} />;
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
