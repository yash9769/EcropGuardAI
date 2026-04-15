import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? '';
        resolve(base64);
      } else {
        reject(new Error('Unable to read file data'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] ?? dataUrl;
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f59e0b';
    case 'medium':
      return '#f97316';
    default:
      return '#22c55e';
  }
}

export async function parseJsonResponse<T>(resp: Response): Promise<T | null> {
  if (!resp.ok) {
    return null;
  }
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return resp.json() as Promise<T>;
}
