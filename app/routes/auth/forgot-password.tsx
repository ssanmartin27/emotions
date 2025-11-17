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
    data,
    redirect,
    useFetcher,
    useSearchParams,
} from 'react-router'
import {useState} from "react";
import {useAuthActions} from "@convex-dev/auth/react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "~/components/ui/input-otp"
import {Alert, AlertDescription, AlertTitle} from "~/components/ui/alert";
import {AlertCircleIcon} from "lucide-react";
import { useNavigate } from "react-router";

export default function ForgotPassword() {

    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false)
    let navigate = useNavigate();

    return (
        <>
        {step === "forgot" ? (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                    <CardDescription>
                        Type in your email and we&apos;ll send you an email with a verification code.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            setLoading(true)
                            const formData = new FormData(event.currentTarget);
                            void signIn("password", formData).then(() => {
                                setStep({ email: formData.get("email") as string});
                                setError(null);
                                }
                            ).catch((err) => {
                                setError("An unexpected error occurred. Please try again.");
                            }).finally(() => setLoading(false));
                        }}
                    >
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
                                    required
                                />
                            </div>
                            <input name="flow" type="hidden" value="reset" />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Code'}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{' '}
                            <Link to="/sign-in" className="underline underline-offset-4">
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                    <CardDescription>
                        Type in the verification code and the new password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setLoading(true)
                            const formData = new FormData(event.currentTarget);
                            try {
                                await signIn("password", formData);
                                navigate("/")
                            } catch (error) {
                                setError("An unexpected error occurred. Please try again.");
                            }
                            finally {
                                setLoading(false)
                            }
                        }}
                    >
                        <div className="flex flex-col gap-6">
                            {error && <Alert variant="destructive">
                                <AlertCircleIcon />
                                <AlertTitle>Something went wrong!</AlertTitle>
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>}
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <div className="flex justify-center">
                                <InputOTP maxLength={8} name="code">
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                        <InputOTPSlot index={6} />
                                        <InputOTPSlot index={7} />
                                    </InputOTPGroup>
                                </InputOTP>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password"> New Password</Label>
                                </div>
                                <Input id="newPassword" type="password" name="newPassword" required />
                                <input name="flow" value="reset-verification" type="hidden" />
                                <input name="email" value={step.email} type="hidden" />
                            </div>
                            <div className="flex gap-2">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Continue'}
                            </Button>
                            <Button type="button" variant="neutral" className="w-full" onClick={() => {setStep("forgot");
                            setError(null);}}>
                                Cancel
                            </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{' '}
                            <Link to="/sign-in" className="underline underline-offset-4">
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}
        </>
    )
}