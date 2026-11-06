import { apiRequest } from './client.js';
import { displayLabel } from '../components/business/content.js';

export const canIncludeTask = (task) =>
  task.status === 'done' || Boolean(task.submission?.submittedAt);

export async function loadReportTasks(assignmentId) {
  const tasks = new Map();
  let page = 1,
    pages = 1;
  do {
    const result = await apiRequest(
      `/core/tasks?assignmentId=${encodeURIComponent(assignmentId)}&page=${page}&limit=100`
    );
    for (const task of result.items) if (canIncludeTask(task)) tasks.set(task._id, task);
    pages = result.pages;
    page++;
  } while (page <= pages);
  return [...tasks.values()];
}

export function reportDraftFromTask(task) {
  const submission = task.submission;
  return {
    title: task.title.slice(0, 200),
    content: [
      `Công việc: ${task.title}`,
      `Trạng thái: ${displayLabel(task.status)}`,
      task.description && `Yêu cầu công việc:\n${task.description}`,
      submission?.content && `Kết quả đã nộp:\n${submission.content}`,
      submission?.link && `Liên kết kết quả: ${submission.link}`,
      submission?.fileName && `Tệp đã nộp trong Công việc & nhật ký: ${submission.fileName}`,
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 50000),
  };
}
