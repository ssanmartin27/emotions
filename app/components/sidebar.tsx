"use client"

import {
    AudioWaveform,
    BadgeCheck, BarChart3,
    Bell,
    BookOpen,
    Bot, Calendar,
    ChevronRight, // This is no longer used but kept in imports for reference
    ChevronsUpDown,
    Command,
    CreditCard, FileText,
    Folder,
    Forward,
    Frame,
    GalleryVerticalEnd, Home,
    LogOut,
    Map,
    MoreHorizontal,
    PieChart,
    Plus, Settings,
    Settings2,
    Sparkles,
    SquareTerminal,
    Trash2, User, Users,
} from "lucide-react"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
// Collapsible components are no longer needed for the main nav
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from "~/components/ui/sidebar"
import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {useAuthActions} from "@convex-dev/auth/react";

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "EMO-KIDS",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: Command,
            plan: "Free",
        },
    ],
    navMain: [
        {
            title: "Home",
            url: "/therapist",
            icon: Home,
            isActive: false,
            // Items array is no longer used for submenus but kept in data structure
            items: [
                {
                    title: "History",
                    url: "#",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "List of Children",
            url: "therapist/children-list",
            icon: Users,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Process Charts",
            url: "therapist/process-charts",
            icon: BarChart3,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Calendar",
            url: "therapist/calendar",
            icon: Calendar,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
        {
            title: "Reports",
            url: "therapist/reports",
            icon: FileText,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        }
    ],
    projects: [
        {
            name: "My Profile",
            url: "therapist/profile",
            icon: User,
        },
        {
            name: "Account Settings",
            url: "#",
            icon: Settings,
        },
    ],
}

const parentNavMain = [
    {
        title: "Home",
        url: "/parent",
        icon: Home,
        items: [],
    },
    {
        title: "Assessments",
        url: "/parent/assessments",
        icon: FileText,
        items: [],
    },
    {
        title: "Progress",
        url: "/parent/progress",
        icon: BarChart3,
        items: [],
    },
    {
        title: "FAQ",
        url: "/parent/faq",
        icon: BookOpen,
        items: [],
    },
]

const therapistNavMain = [
    {
        title: "Home",
        url: "/therapist",
        icon: Home,
        items: [],
    },
    {
        title: "List of Children",
        url: "/therapist/children-list",
        icon: Users,
        items: [],
    },
    {
        title: "Process Charts",
        url: "/therapist/process-charts",
        icon: BarChart3,
        items: [],
    },
    {
        title: "Calendar",
        url: "/therapist/calendar",
        icon: Calendar,
        items: [],
    },
    {
        title: "Reports",
        url: "/therapist/reports",
        icon: FileText,
        items: [],
    },
]

const parentProjects = [
    {
        name: "My Profile",
        url: "/parent/profile",
        icon: User,
    },
]

const therapistProjects = [
    {
        name: "My Profile",
        url: "/therapist/profile",
        icon: User,
    },
    {
        name: "Account Settings",
        url: "#",
        icon: Settings,
    },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: any }) {
    const { isMobile } = useSidebar()
    const activeTeam = data.teams[0] // Use first team as static display
    const { signOut } = useAuthActions();

    // Determine navigation based on user role
    const isParent = user?.role === "parent"
    const isTherapist = user?.role === "therapist"

    const navMain = React.useMemo(() => {
        return isParent ? parentNavMain : isTherapist ? therapistNavMain : data.navMain
    }, [isParent, isTherapist])

    const projects = React.useMemo(() => {
        return isParent ? parentProjects : isTherapist ? therapistProjects : data.projects
    }, [isParent, isTherapist])

    const displayName = React.useMemo(() => {
        return user ? `${user.firstName} ${user.lastName}` : data.user.name
    }, [user])

    const displayEmail = React.useMemo(() => {
        return user?.email || data.user.email
    }, [user])

    // Get profile picture URL using authenticated Convex query
    const profileImageUrl = useQuery(
        api.report.getStorageUrl,
        user?.profilePicture ? { storageId: user.profilePicture as any } : "skip"
    )

    // Generate initials for fallback
    const initials = React.useMemo(() => {
        if (!displayName || displayName === data.user.name) return "CN"
        const names = displayName.split(" ")
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return displayName.substring(0, 2).toUpperCase()
    }, [displayName])

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="peer/menu-button flex w-full items-center gap-2 overflow-hidden outline-2 outline-transparent rounded-base p-2 text-left text-sm ring-ring transition-[width,height,padding] h-12 text-sm group-data-[collapsible=icon]:p-0!">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-base">
                                <activeTeam.logo className="size-4 shrink-0" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-heading">
                                    {activeTeam.name}
                                </span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* --- MODIFIED SECTION --- */}
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        {navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <Link to={item.url}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                {/* --- END MODIFIED SECTION --- */}
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupLabel>System</SidebarGroupLabel>
                    <SidebarMenu>
                        {projects.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton asChild>
                                    <Link to={item.url}>
                                        <item.icon />
                                        <span>{item.name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    className="group-data-[state=collapsed]:hover:outline-0 group-data-[state=collapsed]:hover:bg-transparent overflow-visible"
                                    size="lg"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={profileImageUrl || undefined}
                                            alt={displayName}
                                        />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-heading">
                      {displayName}
                    </span>
                                        <span className="truncate text-xs">{displayEmail}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-base">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={profileImageUrl || undefined}
                                                alt={displayName}
                                            />
                                            <AvatarFallback>{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-heading">
                        {displayName}
                      </span>
                                            <span className="truncate text-xs">
                        {displayEmail}
                      </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles />
                                        Upgrade to Pro
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <BadgeCheck />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CreditCard />
                                        Billing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Bell />
                                        Notifications
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Button onClick={() => void signOut()}>
                                    <LogOut />
                                    Log out
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}