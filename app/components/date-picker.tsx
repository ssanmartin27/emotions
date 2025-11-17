import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface DatePickerProps {
	form: UseFormReturn<any>;
	field: ControllerRenderProps<any, string>;
}

export function DatePicker({ form, field }: DatePickerProps) {
	function handleDateSelect(date: Date | undefined) {
		if (date) {
			// Set time to midnight to avoid time component
			const dateOnly = new Date(date);
			dateOnly.setHours(0, 0, 0, 0);
			form.setValue(field.name, dateOnly);
		}
	}

	return (
		<FormItem className="flex flex-col">
			<FormLabel>
				{field.name === "scheduledDate" ? "Date" : "Date"}
			</FormLabel>
			<Popover modal={true}>
				<PopoverTrigger asChild>
					<FormControl>
						<Button
							variant={"noBorder"}
							className={cn(
								"w-full h-10 pl-3 pr-3 text-left font-normal justify-start border-2 border-border bg-secondary-background hover:bg-accent",
								!field.value && "text-muted-foreground",
							)}
						>
							{field.value ? (
								format(field.value, "MM/dd/yyyy")
							) : (
								<span>MM/DD/YYYY</span>
							)}
							<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
						</Button>
					</FormControl>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={field.value}
						onSelect={handleDateSelect}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
			<FormMessage />
		</FormItem>
	);
}

