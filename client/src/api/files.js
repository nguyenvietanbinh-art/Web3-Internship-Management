import { apiRequest } from './client.js';

export async function downloadFile(path, fileName) {
  const response = await apiRequest(path, { responseType: 'response' });
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  try {
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
