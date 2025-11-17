import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {AlertCircleIcon, PlusCircle, Trash2} from 'lucide-react';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Button } from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription, CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '~/components/ui/form';
import { Checkbox } from '~/components/ui/checkbox';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '~/components/ui/input-otp';

/**
 * Validation schema for children
 */
const childSchema = z.object({
    firstName: z.string().min(2, "Child's first name must be at least 2 characters."),
    lastName: z.string().min(2, "Child's last name must be at least 2 characters."),
    sex: z.enum(["male", "female", "other"], {
        message: "Sex is required",
    }),
    age: z.number().min(1, "Age must be at least 1").max(120, "Invalid age"),
    course: z.string().min(1, "Course is required."),
});

/**
 * Parent signup schema = base user + at least one child
 */
const parentSignUpSchema = z
    .object({
        firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
        lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
        username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
        email: z.string().email({ message: 'Please enter a valid email address.' }),
        password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
        confirmPassword: z.string(),
        terms: z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and conditions.',
        }),
        children: z.array(childSchema).min(1, 'At least one child is required.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

const verificationSchema = z.object({
    code: z.string().min(8, { message: 'Verification code must be 8 characters.' }),
});

export default function ParentSignUpPage() {
    const [step, setStep] = useState<'signUp' | 'verifyEmail'>('signUp');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuthActions();
    const navigate = useNavigate();

    const signUpForm = useForm<z.infer<typeof parentSignUpSchema>>({
        resolver: zodResolver(parentSignUpSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: false,
            children: [
                { firstName: '', lastName: '', sex: 'male', age: 5, course: '' },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: signUpForm.control,
        name: 'children',
    });

    const verificationForm = useForm<z.infer<typeof verificationSchema>>({
        resolver: zodResolver(verificationSchema),
        defaultValues: { code: '' },
    });

    const handleSignUpSubmit = async (values: z.infer<typeof parentSignUpSchema>) => {
        setError(null);
        try {
            const formData = new FormData();

            formData.append('firstName', values.firstName);
            formData.append('lastName', values.lastName);
            formData.append('username', values.username);
            formData.append('email', values.email);
            formData.append('password', values.password);

            // required by Convex
            formData.append('flow', 'signUp');
            // our hidden "type"
            formData.append('role', 'parent');
            // children as JSON
            formData.append('childrenJson', JSON.stringify(values.children));

            await signIn('password', formData);
            setSignUpEmail(values.email);
            setStep('verifyEmail');
        } catch (e) {
            const friendlyMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setError(friendlyMessage);
        }
    };

    const handleVerificationSubmit = async (values: z.infer<typeof verificationSchema>) => {
        setError(null);
        const formData = new FormData();
        formData.append('email', signUpEmail);
        formData.append('code', values.code);
        formData.append('flow', 'email-verification');

        try {
            await signIn('password', formData);
            navigate('/');
        } catch (e) {
            const friendlyMessage = e instanceof Error ? e.message : 'Invalid verification code.';
            setError(friendlyMessage);
        }
    };

    if (step === 'verifyEmail') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription>
                        We've sent a verification code to <strong>{signUpEmail}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...verificationForm}>
                        <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircleIcon className="h-4 w-4" />
                                    <AlertTitle>Verification Failed!</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <FormField
                                control={verificationForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Code</FormLabel>
                                        <FormControl>
                                            <div className="flex justify-center">
                                                <InputOTP maxLength={8} {...field}>
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
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={verificationForm.formState.isSubmitting}>
                                {verificationForm.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
                            </Button>
                            <Button
                                type="button"
                                className="w-full bg-transparent text-black hover:bg-gray-100 font-normal underline underline-offset-4 shadow-none"
                                onClick={() => {
                                    setStep('signUp');
                                    setError(null);
                                    signUpForm.reset();
                                    verificationForm.reset();
                                }}
                            >
                                Back to Sign Up
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Create a Parent Account</CardTitle>
                <CardDescription>Enter your information and your children’s details</CardDescription>
                {error && (
                    <Alert variant="destructive">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle>Something went wrong!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardHeader>
            <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4">
            <CardContent>
                <ScrollArea className="h-[38vh] pr-4">

                            {/* Parent Info */}
                            <div className="grid grid-cols-1 gap-x-8 gap-y-4 pb-2">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium border-b pb-2">Your Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={signUpForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input placeholder="John" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={signUpForm.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl><Input placeholder="johndoe" autoComplete="username" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signUpForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input placeholder="m@example.com" autoComplete="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signUpForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signUpForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                </div>
                            {/* Children Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Children's Information</h3>
                                {fields.map((child, index) => (
                                    <div key={child.id} className="border p-4 rounded-md space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold text-sm">Child {index + 1}</p>
                                            <Button
                                                type="button"
                                                variant="neutral"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            >
                                                <span className="sr-only">Remove Child</span>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={signUpForm.control}
                                                name={`children.${index}.firstName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={signUpForm.control}
                                                name={`children.${index}.lastName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Last Name</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={signUpForm.control}
                                            name={`children.${index}.sex`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sex</FormLabel>
                                                    <FormControl>
                                                        <select {...field} className="w-full border rounded p-2">
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={signUpForm.control}
                                            name={`children.${index}.age`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Age</FormLabel>
                                                    <FormControl><Input type="number" {...field}
                                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={signUpForm.control}
                                            name={`children.${index}.course`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Course</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    className="w-full"
                                    variant="neutral"
                                    onClick={() => append({ firstName: '', lastName: '', sex: 'male', age: 5, course: '' })}
                                >
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                </ScrollArea>
            </CardContent>
                    <CardFooter className="flex flex-col items-stretch gap-2 border-t">
                        <FormField
                            control={signUpForm.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Accept terms and conditions</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            You agree to our Terms of Service and Privacy Policy.
                                        </p>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                            {signUpForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <div className="text-center text-sm">
                            Already have an account?{' '}
                            <Link to="/sign-in" className="underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
