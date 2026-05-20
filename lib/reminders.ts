import type { Visit } from "@prisma/client";

export const STANDARD_FOLLOWUP_DAYS = [0, 3, 7, 15, 30, 49];

export function isOnsiteVisitType(type: string | null | undefined) {
  return type === "来访" || type === "复访" || type === "到访";
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function reminderLabel(days: number) {
  if (days === 0) return "来访当天";
  return `来访后第${days}天`;
}

export function getVisitBaseDate(visit: Pick<Visit, "visitTime" | "createdAt">) {
  const text = visit.visitTime?.trim();
  if (text) {
    const normalized = text.replace(/[年月.]/g, "-").replace("日", "");
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return visit.createdAt;
}

export function getFirstOnsiteVisit(visits: Visit[]) {
  return [...visits]
    .filter((visit) => isOnsiteVisitType(visit.visitType))
    .sort((a, b) => getVisitBaseDate(a).getTime() - getVisitBaseDate(b).getTime())[0];
}

export function getLatestRevisit(visits: Visit[]) {
  return [...visits]
    .filter((visit) => visit.visitType === "复访")
    .sort((a, b) => getVisitBaseDate(b).getTime() - getVisitBaseDate(a).getTime())[0];
}

export function getLatestOnsiteVisit(visits: Visit[]) {
  return [...visits]
    .filter((visit) => isOnsiteVisitType(visit.visitType))
    .sort((a, b) => getVisitBaseDate(b).getTime() - getVisitBaseDate(a).getTime())[0];
}

export function getNextStandardReminder(baseDate: Date, today = new Date()) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const days of STANDARD_FOLLOWUP_DAYS) {
    const dueDate = addDays(baseDate, days);
    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    if (dueStart >= todayStart) {
      return {
        dueDate,
        label: reminderLabel(days)
      };
    }
  }

  let month = 2;
  while (month < 60) {
    const dueDate = addMonths(baseDate, month);
    const day49 = addDays(baseDate, 49);
    if (dueDate <= day49) {
      month += 1;
      continue;
    }

    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    if (dueStart >= todayStart) {
      return {
        dueDate,
        label: "满49天后每月回访"
      };
    }

    month += 1;
  }

  return null;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getStandardReminderForDate(baseDate: Date, targetDate = new Date()) {
  for (const days of STANDARD_FOLLOWUP_DAYS) {
    const dueDate = addDays(baseDate, days);
    if (isSameDate(dueDate, targetDate)) {
      return {
        dueDate,
        label: reminderLabel(days)
      };
    }
  }

  const day49 = addDays(baseDate, 49);
  if (targetDate <= day49) return null;

  let month = 2;
  while (month < 60) {
    const dueDate = addMonths(baseDate, month);
    if (dueDate > day49 && isSameDate(dueDate, targetDate)) {
      return {
        dueDate,
        label: "满49天后每月回访"
      };
    }

    if (dueDate > targetDate) break;
    month += 1;
  }

  return null;
}

export function getReminderState(dueDate: Date, today = new Date()) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const diffDays = Math.round((dueStart - todayStart) / 86400000);

  if (diffDays < 0) return `已逾期${Math.abs(diffDays)}天`;
  if (diffDays === 0) return "今天回访";
  return `${diffDays}天后`;
}

export function standardReminderScript(
  customerName: string | null | undefined,
  context?: {
    budget?: string | null;
    focusPoints?: string[];
    concerns?: string[];
    summary?: string | null;
  }
) {
  const name = customerName || "您好";
  const focus = context?.focusPoints?.filter(Boolean).slice(0, 2).join("、");
  const concerns = context?.concerns?.filter(Boolean).slice(0, 2).join("、");
  const budget = context?.budget;

  if (focus && concerns) {
    return `${name}，上次您说的${concerns}我记着了。我刚看了下，按您关注的${focus}先收窄几套，您有空我发您过一眼。`;
  }

  if (focus) {
    return `${name}，我刚按您上次关注的${focus}看了一圈，有两三套方向还可以。您先看看感觉，不急着定。`;
  }

  if (concerns) {
    return `${name}，您上次提到${concerns}，这个担心挺正常的。我先把这块讲清楚，再给您看合不合适。`;
  }

  if (budget) {
    return `${name}，我按您说的${budget}大概筛了一下，有几套不用太勉强预算。您有空我发您看看。`;
  }

  return `${name}，我刚把您之前看的情况又过了一遍，先挑了几套相对稳一点的。您有空我发您看看。`;
}
