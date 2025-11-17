import React from "react";
import { CalendarBody } from "~/components/calendar-body";
import { CalendarProvider } from "~/components/calendar-context";
import { DndProvider } from "~/components/dnd-context";
import { CalendarHeader } from "~/components/calendar-header";
import type { IEvent, IUser } from "~/components/interfaces";

interface CalendarProps {
	events: IEvent[];
	users: IUser[];
}

export function Calendar({ events, users }: CalendarProps) {
	return (
		<CalendarProvider events={events} users={users} view="month">
			<DndProvider showConfirmation={false}>
				<div className="w-full h-full flex flex-col border-2 border-border rounded-base bg-background overflow-hidden">
					<CalendarHeader />
					<CalendarBody />
				</div>
			</DndProvider>
		</CalendarProvider>
	);
}
