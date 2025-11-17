import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/date-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useCalendar } from "~/components/calendar-context";
import { cn } from "~/lib/utils";
import type { IEvent } from "~/components/interfaces";
import type { Id } from "convex/_generated/dataModel";

const sessionSchema = z.object({
	childId: z.string().min(1, "Child is required"),
	type: z.string().min(1, "Session type is required"),
	scheduledDate: z.date({
		required_error: "Date is required",
	}),
	scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:mm format"),
	duration: z.number().min(15, "Duration must be at least 15 minutes").max(240, "Duration cannot exceed 240 minutes"),
	status: z.enum(["confirmed", "pending", "canceled"], {
		required_error: "Status is required",
	}),
	notes: z.string().optional(),
});

type TSessionFormData = z.infer<typeof sessionSchema>;

interface IProps {
	children: ReactNode;
	startDate?: Date;
	startTime?: { hour: number; minute: number };
	event?: IEvent;
}

export function AddEditEventDialog({
	children,
	startDate,
	startTime,
	event,
}: IProps) {
	const [open, setOpen] = useState(false);
	const createSession = useMutation(api.sessions.createSession);
	const updateSession = useMutation(api.sessions.updateSession);
	const allChildren = useQuery(api.therapists.getAllChildren);
	const isEditing = !!event;
	const { use24HourFormat } = useCalendar();

	const initialDates = useMemo(() => {
		if (!isEditing && !event) {
			if (!startDate) {
				const now = new Date();
				// Normalize to midnight for date-only picker
				const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				return { startDate: dateOnly, endDate: addMinutes(dateOnly, 30) };
			}
			// Normalize to midnight for date-only picker (time is handled separately)
			const dateOnly = new Date(startDate);
			dateOnly.setHours(0, 0, 0, 0);
			return { startDate: dateOnly, endDate: addMinutes(dateOnly, 30) };
		}

		const eventStart = new Date(event.startDate);
		// Normalize to midnight for date-only picker
		eventStart.setHours(0, 0, 0, 0);
		return {
			startDate: eventStart,
			endDate: new Date(event.endDate),
		};
	}, [startDate, startTime, event, isEditing]);

	const form = useForm<TSessionFormData>({
		resolver: zodResolver(sessionSchema),
		defaultValues: {
			childId: "",
			type: "",
			scheduledDate: initialDates.startDate,
			scheduledTime: format(initialDates.startDate, "HH:mm"),
			duration: 30,
			status: "pending",
			notes: "",
		},
	});

	useEffect(() => {
		if (event && isEditing) {
			// Extract childId from event if possible
			const childId = event.user?.id || "";
			const start = new Date(event.startDate);
			// Normalize date to midnight for date-only picker
			const dateOnly = new Date(start);
			dateOnly.setHours(0, 0, 0, 0);
			form.reset({
				childId,
				type: event.title.split(" - ")[1] || "",
				scheduledDate: dateOnly,
				scheduledTime: format(start, "HH:mm"),
				duration: Math.round((new Date(event.endDate).getTime() - start.getTime()) / 60000),
				status: event.color === "green" ? "confirmed" : event.color === "yellow" ? "pending" : "canceled",
				notes: event.description || "",
			});
		} else {
			// Use startTime if provided, otherwise default to current time for time input
			const defaultTime = startTime 
				? `${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}`
				: format(new Date(), "HH:mm");
			form.reset({
				childId: "",
				type: "",
				scheduledDate: initialDates.startDate,
				scheduledTime: defaultTime,
				duration: 30,
				status: "pending",
				notes: "",
			});
		}
	}, [event, initialDates, form, isEditing, startTime]);

	const onSubmit = async (values: TSessionFormData) => {
		try {
			const scheduledDateStr = format(values.scheduledDate, "yyyy-MM-dd");
			
			if (isEditing && event) {
				// For editing, we'd need the sessionId from the event
				// This is a simplified version - you may need to store sessionId in the event
				toast.error("Editing sessions is not yet fully implemented");
				return;
			}

			await createSession({
				childId: values.childId as Id<"kids">,
				scheduledDate: scheduledDateStr,
				scheduledTime: values.scheduledTime,
				duration: values.duration,
				type: values.type,
				status: values.status,
				notes: values.notes,
			});

			toast.success("Session scheduled successfully");
			setOpen(false);
			form.reset();
		} catch (error) {
			console.error("Error scheduling session:", error);
			toast.error("Failed to schedule session");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Session" : "Schedule New Session"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Modify the session details."
							: "Schedule a new therapy session with a child."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						id="session-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4 py-4"
					>
						<FormField
							control={form.control}
							name="childId"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor="childId" className="required">
										Child
									</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="childId"
												className={fieldState.invalid ? "border-red-500" : ""}
											>
												<SelectValue placeholder="Select a child" />
											</SelectTrigger>
											<SelectContent>
												{allChildren?.map((child) => (
													<SelectItem key={child._id} value={child._id}>
														{child.firstName} {child.lastName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="type"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor="type" className="required">
										Session Type
									</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="type"
												className={fieldState.invalid ? "border-red-500" : ""}
											>
												<SelectValue placeholder="Select session type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Individual Therapy">Individual Therapy</SelectItem>
												<SelectItem value="Group Therapy">Group Therapy</SelectItem>
												<SelectItem value="Assessment">Assessment</SelectItem>
												<SelectItem value="Follow-up">Follow-up</SelectItem>
												<SelectItem value="Consultation">Consultation</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="scheduledDate"
								render={({ field }) => (
									<DatePicker form={form} field={field} />
								)}
							/>
							<FormField
								control={form.control}
								name="scheduledTime"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel htmlFor="scheduledTime" className="required">
											Time
										</FormLabel>
										<FormControl>
											<Input
												id="scheduledTime"
												type="time"
												placeholder={use24HourFormat ? "HH:mm" : "hh:mm AM/PM"}
												{...field}
												className={cn(
													fieldState.invalid ? "border-red-500" : "",
													"[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:ml-2"
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="duration"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel htmlFor="duration" className="required">
											Duration (minutes)
										</FormLabel>
										<FormControl>
											<Input
												id="duration"
												type="number"
												min={15}
												max={240}
												step={15}
												placeholder="30"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
												className={fieldState.invalid ? "border-red-500" : ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel htmlFor="status" className="required">
											Status
										</FormLabel>
										<FormControl>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger
													id="status"
													className={fieldState.invalid ? "border-red-500" : ""}
												>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="pending">Pending</SelectItem>
													<SelectItem value="confirmed">Confirmed</SelectItem>
													<SelectItem value="canceled">Canceled</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="notes"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor="notes">Notes (Optional)</FormLabel>
									<FormControl>
										<Textarea
											id="notes"
											placeholder="Add any additional notes about this session..."
											{...field}
											className={fieldState.invalid ? "border-red-500" : ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<DialogFooter className="flex justify-end gap-2">
					<Button type="button" variant="neutral" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button form="session-form" type="submit">
						{isEditing ? "Save Changes" : "Schedule Session"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
