/**
 * Centralized icon mappings for EditorJS custom tools
 * Maps icon names to Lucide React icons
 */
import {
  Sparkles,
  Dumbbell,
  Brain,
  Zap,
  Heart,
  Target,
  TrendingUp,
  Activity,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  MessageCircle,
  Users,
  User,
  Trophy,
  Flame,
  Star,
  Gift,
  ThumbsUp,
  Rocket,
  Lightbulb,
  BookOpen,
  Apple,
  Salad,
  Coffee,
  Pizza,
  Utensils,
  Camera,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  brain: Brain,
  zap: Zap,
  heart: Heart,
  target: Target,
  camera: Camera,
  trendingup: TrendingUp,
  trending: TrendingUp,
  activity: Activity,
  award: Award,
  calendar: Calendar,
  clock: Clock,
  check: CheckCircle,
  checkcircle: CheckCircle,
  alert: AlertCircle,
  alertcircle: AlertCircle,
  info: Info,
  message: MessageCircle,
  messagecircle: MessageCircle,
  users: Users,
  user: User,
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  star: Star,
  gift: Gift,
  thumbsup: ThumbsUp,
  like: ThumbsUp,
  rocket: Rocket,
  lightbulb: Lightbulb,
  bulb: Lightbulb,
  idea: Lightbulb,
  book: BookOpen,
  bookopen: BookOpen,
  apple: Apple,
  salad: Salad,
  coffee: Coffee,
  pizza: Pizza,
  utensils: Utensils,
  food: Utensils,
};

/**
 * Searches for an icon by name (case insensitive, fuzzy match)
 * Returns the icon component if found, null otherwise
 */
export function findIcon(iconName: string): LucideIcon | null {
  if (!iconName) return null;
  const normalizedName = iconName.toLowerCase().replace(/[\s-_]/g, "");
  return ICON_MAP[normalizedName] || null;
}
