import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AvatarGroup } from "~/components/avatar-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useCalendar } from "~/components/calendar-context";

export function UserSelect() {
	const { users, selectedUserId, filterEventsBySelectedUser } = useCalendar();

	return (
		<Select value={selectedUserId!} onValueChange={filterEventsBySelectedUser}>
			<SelectTrigger className="w-fit min-w-[200px] h-10 border-2 border-border bg-secondary-background shadow-xs hover:bg-accent px-4">
				<SelectValue placeholder="Select a user" className="w-full">
					<div className="flex items-center gap-4 w-full">
						<AvatarGroup className="flex items-center flex-shrink-0 pr-1" max={3}>
							{users.map((user) => (
								<Avatar key={user.id} className="size-7 text-xs">
									<AvatarImage
										src={user.picturePath ?? undefined}
										alt={user.name}
									/>
									<AvatarFallback className="text-xs">
										{user.name[0]}
									</AvatarFallback>
								</Avatar>
							))}
						</AvatarGroup>
						<span className="text-foreground font-medium whitespace-nowrap flex-shrink-0">All</span>
					</div>
				</SelectValue>
			</SelectTrigger>
			<SelectContent align="end" className="min-w-[200px]">
				<SelectItem value="all" className="cursor-pointer">
					<div className="flex items-center gap-3">
						<AvatarGroup className="flex items-center" max={3}>
							{users.map((user) => (
								<Avatar key={user.id} className="size-7 text-xs">
									<AvatarImage
										src={user.picturePath ?? undefined}
										alt={user.name}
									/>
									<AvatarFallback className="text-xs">
										{user.name[0]}
									</AvatarFallback>
								</Avatar>
							))}
						</AvatarGroup>
						<span className="ml-2 text-foreground font-medium">All</span>
					</div>
				</SelectItem>

				{users.map((user) => (
					<SelectItem
						key={user.id}
						value={user.id}
						className="cursor-pointer"
					>
						<div className="flex items-center gap-2">
							<Avatar key={user.id} className="size-6">
								<AvatarImage
									src={user.picturePath ?? undefined}
									alt={user.name}
								/>
								<AvatarFallback className="text-xxs bg-muted text-foreground">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>

							<p className="truncate text-foreground">{user.name}</p>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
