import { Button } from '~/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription, CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { type ActionFunctionArgs, Link, redirect, useFetcher, useSearchParams } from 'react-router'
import {useState} from "react";
import {RoleCard} from "~/components/role-cards";
import {BookOpen, BriefcaseMedical, Users} from "lucide-react";



export default function SignupPage() {

    return (
        <div className="flex w-full flex-col items-center justify-center bg-secondary-background p-16">
        <h1 className="mb-32 text-center text-3xl font-bold md:text-5xl">
                How will you be joining us?
        </h1>
        <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-32 md:flex-row lg:items-stretch">
            <RoleCard
                icon={Users} // 👨‍👩‍👧 Updated Icon
                title="Father / Mother" // Updated Title
                description="Monitor your child's progress and well-being." // Updated Description
                to="/sign-up/parent"
            />

            <RoleCard
                icon={BriefcaseMedical} // ⚕️ Unchanged
                title="Therapist"
                description="Manage clients and track their progress."
                to="/sign-up/therapist"
            />
        </div>
        </div>
    )
}