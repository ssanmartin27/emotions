import {Button} from "~/components/ui/button";
import Star33 from "../../components/stars/s33";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "~/components/ui/card";
import {ArrowRight, type LucideIcon} from "lucide-react";
import {Link} from "react-router";

interface RoleCardProps {
    icon: LucideIcon; // The icon component itself
    title: string;
    description: string;
    to: string;
}

export function RoleCard({ icon: Icon, title, description, to }: RoleCardProps) {
    return (
        <Link to={to} className="block w-full flex-shrink-0 max-w-sm">
        <Card className=" h-full text-main-foreground bg-main border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none" >
            <CardHeader className="">
                {/* Updated: CardTitle now includes the arrow icon again */}
                <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <CardTitle>{title}</CardTitle>
                </div>

                <CardDescription className="pt-2">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* optional children or placeholder */}
            </CardContent>

            <CardFooter className="flex justify-end">
                <ArrowRight className="h-4 w-4" />
            </CardFooter>
        </Card>
        </Link>
    )
}