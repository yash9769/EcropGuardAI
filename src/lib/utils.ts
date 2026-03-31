import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return '#4ade80';
    case 'medium': return '#fbbf24';
    case 'high': return '#f97316';
    case 'critical': return '#f87171';
    default: return '#4ade80';
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'low': return 'Low';
    case 'medium': return 'Moderate';
    case 'high': return 'High';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl;
}
