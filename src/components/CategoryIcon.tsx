import React from 'react';
import {
  Briefcase,
  Users,
  Mail,
  BookOpen,
  Moon,
  Activity,
  Utensils,
  Compass,
  Home,
  Navigation,
  CheckSquare,
  Heart,
  Smile,
  Sparkles,
  Gamepad2,
  Shield,
  Clock,
  Coffee,
  Code,
  Folder,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  Users,
  Mail,
  BookOpen,
  Moon,
  Activity,
  Utensils,
  Compass,
  Home,
  Navigation,
  CheckSquare,
  Heart,
  Smile,
  Sparkles,
  Gamepad2,
  Shield,
  Clock,
  Coffee,
  Code,
  Folder,
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-4 h-4' }) => {
  const IconComponent = ICON_MAP[iconName] || Folder;
  return <IconComponent className={className} />;
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
