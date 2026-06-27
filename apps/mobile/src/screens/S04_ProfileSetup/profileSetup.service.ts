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
    label: 'Visual impairment', 
    description: 'Screen reader & high-contrast', 
    icon: 'eye-off', 
    color: '#8B5CF6' 
  },
  { 
    id: 'motor', 
    label: 'Mobility impairment', 
    description: 'Large targets & one-tap confirm', 
    icon: 'hand-back-right-off', 
    color: '#F59E0B' 
  },
  { 
    id: 'handsFree', 
    label: 'Hands-free', 
    description: 'Voice-only, no touch needed', 
    icon: 'gesture-tap-hold', 
    color: '#3B82F6' 
  },
];

export const SPEED_OPTIONS: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast'];
