import {Button} from "~/components/ui/button";
import Star33 from "../../components/stars/s33";
import { Link } from "react-router";

interface SiteHeaderProps {
    user?: {
        role?: "therapist" | "parent";
    } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
    // Determine home URL based on user role
    const homeUrl = user?.role === "therapist" ? "/therapist" : user?.role === "parent" ? "/parent" : "/";
    
    return (
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-secondary-background border-y-2 border-border">
            <div className="flex items-center gap-2 px-4">
                <Link 
                    to={homeUrl}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                    <Star33
                        className="text-red-500 dark:text-blue-500"
                        size={46}
                        stroke="black"
                        strokeWidth={2}
                    />
                    <h1 className="font-heading w500:text-2xl w400:text-xl text-3xl">Emo-Kids</h1>
                </Link>
            </div>
        </header>
    )
}