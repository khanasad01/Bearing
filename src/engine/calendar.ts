import { WeeklyPlanResult } from './planner';
import { DayOfWeek } from '../types/coach';

/**
 * Calendar Integration Engine
 * Generates RFC 5545 compliant iCalendar (.ics) format
 * allowing users to sync their realistic weekly plan with Google Calendar / Apple Calendar.
 */
export function generateIcsCalendar(plan: WeeklyPlanResult, weekStartDate?: Date): string {
  const baseDate = weekStartDate || getUpcomingMonday();

  const dayOffsets: Record<DayOfWeek, number> = {
    mon: 0,
    tue: 1,
    wed: 2,
    thu: 3,
    fri: 4,
    sat: 5,
    sun: 6,
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bearing//Adaptive Personal Coach//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Bearing Weekly Plan',
  ];

  for (const [dayKey, dayObj] of Object.entries(plan.days)) {
    const offset = dayOffsets[dayKey as DayOfWeek] || 0;
    const taskDate = new Date(baseDate);
    taskDate.setDate(baseDate.getDate() + offset);

    let startHour = 9; // Start at 9:00 AM
    let startMin = 0;

    for (const task of dayObj.tasks) {
      const eventStart = new Date(taskDate);
      eventStart.setHours(startHour, startMin, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventStart.getMinutes() + task.plannedMinutes);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:bearing-${task.id}@bearing.coach`);
      lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
      lines.push(`DTSTART:${formatIcsDate(eventStart)}`);
      lines.push(`DTEND:${formatIcsDate(eventEnd)}`);
      lines.push(`SUMMARY:[Bearing] ${task.title}`);
      lines.push(
        `DESCRIPTION:${escapeIcs(
          `Kickstart Prompt: ${task.nextAction?.kickoffPrompt || 'Start 1st deliverable'}\nCategory: ${
            task.category
          }\nPlanned: ${task.plannedMinutes} mins`
        )}`
      );
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');

      // Next task starts 30 mins after previous ends
      startHour = eventEnd.getHours();
      startMin = eventEnd.getMinutes() + 30;
      if (startMin >= 60) {
        startHour += Math.floor(startMin / 60);
        startMin = startMin % 60;
      }
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function getUpcomingMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcs(str: string): string {
  return str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
