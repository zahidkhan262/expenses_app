import { endOfMonth, format, parse, startOfMonth, subMonths, endOfWeek, isBefore, min, addDays } from "date-fns";

export function buildMonthOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const d = subMonths(now, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });
}

export function monthRange(month: string) {
  if (month === "all" || !month) return { from: undefined, to: undefined };
  const date = parse(month, "yyyy-MM", new Date());
  return {
    from: format(startOfMonth(date), "yyyy-MM-dd"),
    to: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function buildYearOptions(yearsBack = 5) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }).map((_, i) => {
    const y = currentYear - i;
    return { value: y.toString(), label: y.toString() };
  });
}

export function buildMonthList() {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
}

export function getWeeksForMonth(year: string, month: string) {
  if (!year || !month || month === "all") return [];
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  let current = start;
  const weeks = [];
  let weekNum = 1;
  
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    const weekStart = current;
    const weekEnd = min([endOfWeek(current, { weekStartsOn: 1 }), end]);
    
    weeks.push({
      value: weekNum.toString(),
      label: `Week ${weekNum} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`,
      from: format(weekStart, "yyyy-MM-dd"),
      to: format(weekEnd, "yyyy-MM-dd")
    });
    
    current = addDays(weekEnd, 1);
    weekNum++;
  }
  return weeks;
}

export function computeDateRange(year: string, month: string, week: string, weeksMap: ReturnType<typeof getWeeksForMonth>) {
  if (year && month !== "all" && week !== "all") {
    const w = weeksMap.find(x => x.value === week);
    if (w) return { from: w.from, to: w.to };
  }
  if (year && month !== "all") {
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return {
      from: format(startOfMonth(date), "yyyy-MM-dd"),
      to: format(endOfMonth(date), "yyyy-MM-dd"),
    };
  }
  if (year && year !== "all") {
    const date = new Date(parseInt(year), 0, 1);
    return {
      from: format(date, "yyyy-MM-dd"),
      to: format(endOfMonth(new Date(parseInt(year), 11, 1)), "yyyy-MM-dd"),
    };
  }
  return { from: undefined, to: undefined };
}
