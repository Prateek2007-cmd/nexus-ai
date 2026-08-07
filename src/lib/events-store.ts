/**
 * Campus events store.
 *
 * In-memory event registry seeded from `@/lib/mock` events, plus a
 * registration tracker shared by the events / calendar / assistant routes.
 */

import { events as mockEvents } from "@/lib/mock";

export type CampusEvent = {
  title: string;
  org: string;
  date: string;
  seats: number;
  tag?: string;
  venue?: string;
  registered?: boolean;
};

const registeredTitles = new Set<string>();

export function getAllEvents(): CampusEvent[] {
  return mockEvents.map((event) => ({
    ...event,
    registered: registeredTitles.has(event.title),
  }));
}

export function getRegisteredEventTitles(): string[] {
  return Array.from(registeredTitles);
}

export function registerEventInStore(title: string, _date?: string): void {
  registeredTitles.add(title);
}

export function unregisterEventInStore(title: string): void {
  registeredTitles.delete(title);
}
