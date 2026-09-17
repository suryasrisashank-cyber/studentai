import React from 'react';
import {
  GraduationCap,
  Percent,
  CalendarCheck,
  Calendar,
  Timer,
  FileText,
  Type,
  CheckSquare,
  KeyRound,
  CaseSensitive,
  Sparkles,
  ArrowLeftRight,
  Clock,
  CalendarDays,
  QrCode,
  Minimize2,
  Maximize2,
  FileCheck2,
  SearchCode,
  HelpCircle,
  BookOpen,
  Briefcase,
  FileImage,
  Wrench,
  LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  GraduationCap,
  Percent,
  CalendarCheck,
  Calendar,
  Timer,
  FileText,
  Type,
  CheckSquare,
  KeyRound,
  CaseSensitive,
  Sparkles,
  ArrowLeftRight,
  Clock,
  CalendarDays,
  QrCode,
  Minimize2,
  Maximize2,
  FileCheck2,
  SearchCode,
  HelpCircle,
  BookOpen,
  Briefcase,
  FileImage,
  Wrench,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = ICON_MAP[name] || Wrench;
  return <IconComponent {...props} />;
}
