import { Button } from '~/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
    type ActionFunctionArgs,
    Link,
    Navigate,
    redirect,
    useFetcher,
    useNavigate,
    useOutletContext
} from 'react-router'
import {useEffect, useState} from "react";
import {useAuthActions} from "@convex-dev/auth/react";
import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuthActions();
    let navigate = useNavigate();
    const cxt = useOutletContext();
    const user = cxt?.user;

    useEffect(() => {
        if (user) {
            if (user.role === "therapist") navigate("/therapist");
            else navigate("/parent");
        }
    }, [user]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        setLoading(true);
                        const formData = new FormData(event.currentTarget);
                        try {
                            await signIn("password", formData);
                            if (user) {
                                user.role == "therapist" ?  navigate("therapist") : navigate("parent")
                            }
                            //navigate("/")
                        } catch (e) {
                            let friendlyMessage = "An unexpected error occurred. Please try again.";
                            if (e instanceof Error) {
                                const message = e.message;
                                // Show specific error messages for authentication failures
                                if (message.includes("InvalidSecret")) {
                                    friendlyMessage = "Incorrect password. Please try again.";
                                } else if (message.includes("InvalidAccountId") ||
                                          message.includes("account not found") ||
                                          message.includes("user not found") ||
                                          message.includes("no account")) {
                                    friendlyMessage = "No account found with this email address. Please check your email or sign up.";
                                } else if (message.includes("invalid credentials") ||
                                          message.includes("authentication failed")) {
                                    friendlyMessage = "Invalid email or password. Please try again.";
                                } else if (message.includes("server error") || 
                                          message.includes("internal error") ||
                                          (message.includes("convex") && message.toLowerCase().includes("server error"))) {
                                    friendlyMessage = "A server error occurred. Please try again later.";
                                } else {
                                    // For other errors, show the actual error message
                                    friendlyMessage = message;
                                }

                                setError(friendlyMessage);
                            } else {
                                setError("An unexpected error occurred. Please try again.");
                            }
                        } finally {
                            setLoading(false);
                        }

                    }}>
                    <div className="flex flex-col gap-6">
                        {error && <Alert variant="destructive">
                            <AlertCircleIcon />
                            <AlertTitle>Something went wrong!</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                            <Input 
                                id="password" 
                                type="password" 
                                name="password" 
                                autoComplete="current-password"
                                required 
                            />
                            <input name="flow" type="hidden" value="signIn" />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link to="/role" className="underline underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}