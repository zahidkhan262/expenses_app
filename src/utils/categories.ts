import {
  Bike,
  Building2,
  CreditCard,
  HandHelping,
  HeartPulse,
  Home,
  Package,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "Transport"
  | "Rent"
  | "Shopping"
  | "Other Shopping"
  | "Bills"
  | "Medical"
  | "Room Food"
  | "Home"
  | "Help";

export type CategoryMeta = {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  badgeClass: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "Transport",
    label: "Transport",
    icon: Bike,
    colorClass: "text-sky-600 dark:text-sky-400",
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  },
  {
    key: "Rent",
    label: "Rent",
    icon: Building2,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  },
  {
    key: "Shopping",
    label: "Shopping",
    icon: ShoppingBag,
    colorClass: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeClass:
      "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
  },
  {
    key: "Other Shopping",
    label: "Other Shopping",
    icon: Package,
    colorClass: "text-violet-600 dark:text-violet-400",
    badgeClass:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
  {
    key: "Bills",
    label: "Bills",
    icon: CreditCard,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  {
    key: "Medical",
    label: "Medical",
    icon: HeartPulse,
    colorClass: "text-rose-600 dark:text-rose-400",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  {
    key: "Room Food",
    label: "Room Food",
    icon: UtensilsCrossed,
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  {
    key: "Home",
    label: "Home",
    icon: Home,
    colorClass: "text-teal-600 dark:text-teal-400",
    badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  },
  {
    key: "Help",
    label: "Help",
    icon: HandHelping,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  },
];

export function getCategoryMeta(category: string) {
  return CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

