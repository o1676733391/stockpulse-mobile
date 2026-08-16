import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Barcode,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  History,
  Home,
  LucideIcon,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Package,
  PackageOpen,
  Pencil,
  Play,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  SkipForward,
  Store,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react-native';
import React from 'react';

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Barcode,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  History,
  Home,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Package,
  PackageOpen,
  Pencil,
  Play,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  SkipForward,
  Store,
  TrendingDown,
  TrendingUp,
  X,
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function VectorIcon({ name, size = 20, color = '#0f172a', strokeWidth = 2 }: IconProps) {
  const IconComponent = ICON_MAP[name] ?? Package;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
