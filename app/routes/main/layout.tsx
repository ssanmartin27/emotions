import {Navigate, Outlet, useOutletContext} from "react-router";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/sidebar"
import { Authenticated, Unauthenticated } from "convex/react";



export default function Layout() {
    const { user } = useOutletContext<{ user: any }>()

    return (
        <>
        <Authenticated>
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-secondary-background">
                <Outlet/>
                </div>
            </SidebarInset>
        </SidebarProvider>
        </Authenticated>


        <Unauthenticated>
            <Navigate to="/sign-in" replace/>
        </Unauthenticated>
        </>
    )
}