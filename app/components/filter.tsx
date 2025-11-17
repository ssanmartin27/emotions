import { CheckIcon, Filter, RefreshCcw } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { Toggle } from "~/components/ui/toggle";
import { useCalendar } from "~/components/calendar-context";
import type { TEventColor } from "~/components/types";

type SessionStatus = "confirmed" | "pending" | "canceled";

const statusConfig: Record<SessionStatus, { label: string; color: TEventColor }> = {
	confirmed: { label: "Confirmed", color: "green" },
	pending: { label: "Pending", color: "yellow" },
	canceled: { label: "Canceled", color: "red" },
};

export default function FilterEvents() {
	const { selectedColors, filterEventsBySelectedColors, clearFilter } =
		useCalendar();

	const statuses: SessionStatus[] = ["confirmed", "pending", "canceled"];

	// Helper to check if a status is selected (by checking if its color is selected)
	const isStatusSelected = (status: SessionStatus) => {
		const statusColor = statusConfig[status].color;
		return selectedColors.includes(statusColor);
	};

	const handleStatusToggle = (status: SessionStatus) => {
		const statusColor = statusConfig[status].color;
		filterEventsBySelectedColors(statusColor);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Toggle variant="outline" className="cursor-pointer w-fit h-10">
					<Filter className="h-4 w-4" />
				</Toggle>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[180px]">
				{statuses.map((status) => {
					const config = statusConfig[status];
					const isSelected = isStatusSelected(status);
					
					return (
						<DropdownMenuItem
							key={status}
							className="flex items-center gap-2 cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								handleStatusToggle(status);
							}}
						>
							<div
								className={`size-3.5 rounded-full bg-${config.color}-600 dark:bg-${config.color}-700`}
							/>
							<span className="flex-1 flex items-center justify-between">
								{config.label}
								{isSelected && (
									<CheckIcon className="size-4 text-primary" />
								)}
							</span>
						</DropdownMenuItem>
					);
				})}
				<Separator className="my-2" />
				<DropdownMenuItem
					disabled={selectedColors.length === 0}
					className="flex gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						clearFilter();
					}}
				>
					<RefreshCcw className="size-3.5" />
					Clear Filter
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
