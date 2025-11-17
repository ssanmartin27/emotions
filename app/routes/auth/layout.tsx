import {Link, Navigate, Outlet, useOutletContext} from "react-router";
import {Authenticated, Unauthenticated} from "convex/react";
import {SiteHeader} from "~/components/site-header";

export default function Layout() {
    const {user} = useOutletContext();
    return (
        <>
        <Unauthenticated>
    <SiteHeader user={user} />
    <div className="flex flex-1 w-full items-center justify-center p-2 md:p-4 bg-secondary-background">

        <div className="w-full max-w-md">
             <div className="flex flex-col gap-2">
                <Outlet />
            </div>
        </div>
    </div>
        </Unauthenticated>
        <Authenticated>
           <Navigate to={user?.role === "therapist" ? "/therapist" : "parent"}></Navigate>
        </Authenticated>
        </>

    );
}