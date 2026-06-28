export interface AccessibilityOption {
  id: 'visual' | 'motor' | 'handsFree';
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const ACCESSIBILITY_OPTIONS: AccessibilityOption[] = [
  { 
    id: 'visual', 
    label: 'Khiếm thị', 
    description: 'Đọc màn hình và tương phản cao', 
    icon: 'eye-off', 
    color: '#8B5CF6' 
  },
  { 
    id: 'motor', 
    label: 'Khó khăn vận động', 
    description: 'Vùng chạm lớn và xác nhận một chạm', 
    icon: 'hand-back-right-off', 
    color: '#F59E0B' 
  },
  { 
    id: 'handsFree', 
    label: 'Rảnh tay', 
    description: 'Chỉ dùng giọng nói, không cần chạm', 
    icon: 'gesture-tap-hold', 
    color: '#3B82F6' 
  },
];

export const SPEED_OPTIONS: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast'];
