import * as React from "react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

type AvatarProps = React.ComponentProps<typeof Avatar>;

interface AvatarGroupProps extends React.ComponentProps<"div"> {
	children: React.ReactElement<AvatarProps>[];
	max?: number;
}

// Color palette for avatars
const avatarColors = [
	"bg-rose-500",
	"bg-blue-500",
	"bg-green-500",
	"bg-yellow-500",
	"bg-purple-500",
	"bg-orange-500",
	"bg-pink-500",
	"bg-cyan-500",
];

const AvatarGroup = ({
	children,
	max,
	className,
	...props
}: AvatarGroupProps) => {
	const totalAvatars = React.Children.count(children);
	const displayedAvatars = React.Children.toArray(children)
		.slice(0, max)
		.reverse();
	const remainingAvatars = max ? Math.max(totalAvatars - max, 1) : 0;

	return (
		<div
			className={cn("flex items-center flex-row-reverse pl-1", className)}
			{...props}
		>
			{remainingAvatars > 0 && (
				<Avatar className="size-7 -ml-1 hover:z-10 relative ring-1 ring-background border border-border">
					<AvatarFallback className="bg-slate-600 text-white font-semibold text-xs">
						+{remainingAvatars}
					</AvatarFallback>
				</Avatar>
			)}
			{displayedAvatars.map((avatar, index) => {
				if (!React.isValidElement(avatar)) return null;

				const colorIndex = index % avatarColors.length;
				const avatarColor = avatarColors[colorIndex];

				// Clone avatar and apply color to AvatarFallback
				// We need to recursively find AvatarFallback in the children tree
				const applyColorToFallback = (element: React.ReactElement): React.ReactElement => {
					const props = element.props as any;
					
					// Check if this is AvatarFallback
					if (props?.["data-slot"] === "avatar-fallback" || 
					    element.type === AvatarFallback ||
					    (element.type as any)?.displayName === "AvatarFallback") {
						// Remove any existing background color classes
						const cleanedClassName = (props.className || "")
							.split(/\s+/)
							.filter((cls: string) => !cls.startsWith("bg-") && cls !== "text-foreground" && cls !== "text-white")
							.join(" ");
						
						return React.cloneElement(element, {
							className: cn(
								avatarColor,
								"text-white font-semibold text-xs",
								cleanedClassName
							),
						});
					}
					
					// If it has children, recursively process them
					if (props.children) {
						const processedChildren = React.Children.map(props.children, (child) => {
							if (React.isValidElement(child)) {
								return applyColorToFallback(child);
							}
							return child;
						});
						
						return React.cloneElement(element, {
							children: processedChildren,
						});
					}
					
					return element;
				};
				
				const clonedChildren = React.Children.map(avatar.props.children, (child) => {
					if (React.isValidElement(child)) {
						return applyColorToFallback(child);
					}
					return child;
				});

				return (
					<div key={index} className="-ml-1 hover:z-10 relative first:ml-0 first:mr-0">
						{React.cloneElement(avatar as React.ReactElement<AvatarProps>, {
							className: cn("size-7 ring-1 ring-background border border-border", avatar.props.className?.replace(/size-\d+/, "").trim()),
							children: clonedChildren,
						})}
					</div>
				);
			})}
		</div>
	);
};

export { AvatarGroup };
