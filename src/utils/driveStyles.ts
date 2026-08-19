
export const DRIVE_COLORS: Record<number, string> = {
  1: '#06b6d4', // Turquoise (Updated from Red)
  2: '#ec4899', // Pink
  3: '#f97316', // Orange
  4: '#eab308', // Yellow
  5: '#3b82f6', // Blue
  6: '#22c55e'  // Green
};

export const SPECIAL_DRIVE_COLOR = '#581c87'; // Dark Purple

export function getDriveColor(classNumber: number, isSpecialDrive?: boolean): string {
  if (isSpecialDrive) return SPECIAL_DRIVE_COLOR;
  return DRIVE_COLORS[classNumber as keyof typeof DRIVE_COLORS] || '#6366f1';
}

export function getDriveColorClass(classNumber: number, isSpecialDrive?: boolean): string {
  if (isSpecialDrive) return 'bg-purple-900 text-purple-50 border-purple-950';
  
  switch (classNumber) {
    case 1: return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 2: return 'bg-pink-50 text-pink-800 border-pink-200';
    case 3: return 'bg-orange-50 text-orange-800 border-orange-200';
    case 4: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 5: return 'bg-blue-50 text-blue-800 border-blue-200';
    case 6: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default: return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }
}
