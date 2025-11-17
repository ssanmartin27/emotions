"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "~/components/ui/sheet"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover"
import { format } from "date-fns"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { Id } from "convex/_generated/dataModel"

// Zod validation schema
const therapistProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
    phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Invalid phone number format").optional().or(z.literal("")),
    license: z.string().max(100, "License must be less than 100 characters").optional().or(z.literal("")),
    experience: z.string().regex(/^\d+$/, "Experience must be a number").refine((val) => {
        const num = parseInt(val)
        return num >= 0 && num <= 100
    }, "Experience must be between 0 and 100 years").optional().or(z.literal("")),
    specialties: z.string().max(500, "Specialties must be less than 500 characters").optional().or(z.literal("")),
    institutions: z.string().max(500, "Institutions must be less than 500 characters").optional().or(z.literal("")),
    gender: z.string().max(50, "Gender must be less than 50 characters").optional().or(z.literal("")),
    birthDate: z.date().nullable().optional().refine((date) => {
        if (!date) return true
        const today = new Date()
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
        return date >= minDate && date <= today
    }, "Birth date must be valid and not in the future"),
    languages: z.string().max(200, "Languages must be less than 200 characters").optional().or(z.literal("")),
    bio: z.string().max(2000, "Bio must be less than 2000 characters").optional().or(z.literal("")),
})

type TherapistProfileFormData = z.infer<typeof therapistProfileSchema>

export default function TherapistProfile() {
    const profile = useQuery(api.therapists.getTherapistProfile)
    const updateProfile = useMutation(api.therapists.updateTherapistProfile)
    const generateUploadUrl = useMutation(api.report.generateUploadUrl)
    const storageUrl = useQuery(
        api.report.getStorageUrl,
        profile?.profilePicture ? { storageId: profile.profilePicture } : "skip"
    )

    // Get profile image URL - use authenticated URL from query
    const getProfileImageUrl = () => {
        if (!profile?.profilePicture) return null
        return storageUrl || null
    }

    const form = useForm<TherapistProfileFormData>({
        resolver: zodResolver(therapistProfileSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            license: "",
            experience: "",
            specialties: "",
            institutions: "",
            gender: "",
            birthDate: null,
            languages: "",
            bio: "",
        },
    })

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [profileImagePreview, setProfileImagePreview] = useState<string>("")
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Load profile data into form and set profile picture preview
    useEffect(() => {
        if (profile) {
            form.reset({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phone: profile.phone || "",
                license: profile.license || "",
                experience: profile.experience?.toString() || "",
                specialties: profile.specialties || "",
                institutions: profile.institutions || "",
                gender: profile.gender || "",
                birthDate: profile.birthDate ? new Date(profile.birthDate) : null,
                languages: profile.languages || "",
                bio: profile.bio || "",
            })
            
            // Don't set preview from saved profile - let it load from storage URL directly
            // Preview should only be used for new file selections before saving
            // Only clear preview if no new file is selected
            if (!profileImageFile) {
                setProfileImagePreview("")
            }
        }
    }, [profile, form, profileImageFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB")
            return
        }

        setProfileImageFile(file)
        const reader = new FileReader()
        reader.onload = () => setProfileImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async (data: TherapistProfileFormData) => {
        setIsSaving(true)
        try {
            let profilePictureId: Id<"_storage"> | undefined = undefined

            // Upload profile picture if selected
            if (profileImageFile) {
                setIsUploading(true)
                try {
                    // Step 1: Generate upload URL
                    const uploadUrl = await generateUploadUrl()
                    
                    // Step 2: Upload file to Convex storage
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": profileImageFile.type },
                        body: profileImageFile,
                    })
                    
                    if (!result.ok) {
                        throw new Error(`Upload failed with status ${result.status}`)
                    }
                    
                    // Step 3: Get storage ID from response
                    const responseData = await result.json()
                    const storageId = responseData.storageId
                    
                    if (!storageId) {
                        throw new Error("No storageId returned from upload")
                    }
                    
                    profilePictureId = storageId as Id<"_storage">
                } catch (error) {
                    console.error("Upload error:", error)
                    toast.error(`Failed to upload profile picture: ${error instanceof Error ? error.message : "Unknown error"}`)
                    setIsUploading(false)
                    setIsSaving(false)
                    return
                } finally {
                    setIsUploading(false)
                }
            } else if (profile?.profilePicture) {
                // Keep existing profile picture if no new file selected
                profilePictureId = profile.profilePicture
            }

            // Update profile
            await updateProfile({
                firstName: data.firstName || undefined,
                lastName: data.lastName || undefined,
                phone: data.phone || undefined,
                license: data.license || undefined,
                experience: data.experience ? parseInt(data.experience) : undefined,
                specialties: data.specialties || undefined,
                institutions: data.institutions || undefined,
                gender: data.gender || undefined,
                birthDate: data.birthDate ? data.birthDate.getTime() : undefined,
                languages: data.languages || undefined,
                bio: data.bio || undefined,
                profilePicture: profilePictureId,
            })

            toast.success("Profile updated successfully")
            setProfileImageFile(null)
            // Clear preview so the actual stored image will be shown from profile data
            setProfileImagePreview("")
        } catch (error) {
            toast.error("Failed to update profile")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!profile) {
        return (
            <div className="w-full flex justify-center mt-8">
                <Card className="w-full max-w-4xl">
                    <CardContent className="p-8">
                        <p>Loading profile...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const fullName = `${profile.firstName} ${profile.lastName}`
    // If there's a new file selected but not yet saved, show preview (FileReader data URL)
    // Otherwise show stored image from Convex storage using client.getUrl
    const displayImageUrl = profileImagePreview || getProfileImageUrl()

    return (
        <div className="w-full flex justify-center mt-8">
            <Card className="w-full max-w-4xl border-2 border-black shadow-[4px_4px_0_0_#000]">
                <CardHeader className="flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4 rounded-full border-2 border-black overflow-hidden bg-white shadow-[3px_3px_0_0_#000]">
                        {displayImageUrl ? (
                            <img
                                src={displayImageUrl}
                                alt="Profile"
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    // If image fails to load, hide it and show fallback
                                    e.currentTarget.style.display = 'none'
                                    const parent = e.currentTarget.parentElement
                                    if (parent && !parent.querySelector('.fallback-text')) {
                                        const fallback = document.createElement('div')
                                        fallback.className = 'flex items-center justify-center h-full text-sm fallback-text'
                                        fallback.textContent = 'No Image'
                                        parent.appendChild(fallback)
                                    }
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm">
                                No Image
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Administra tu información
                    </p>
                </CardHeader>

                <CardContent className="grid gap-8 px-8 py-4">
                    {/* Therapist Info */}
                    <section className="grid gap-2">
                        <h3 className="font-semibold text-lg border-b-2 border-black pb-1">
                            Información del terapeuta
                        </h3>
                        <p>
                            <strong>Correo electrónico:</strong> {profile.email}
                        </p>
                        <p>
                            <strong>Teléfono:</strong> {profile.phone || "—"}
                        </p>
                    </section>

                    {/* Professional Info */}
                    <section className="grid gap-2">
                        <h3 className="font-semibold text-lg border-b-2 border-black pb-1">
                            Información profesional
                        </h3>
                        <p>
                            <strong>Número de licencia / certificación:</strong>{" "}
                            {profile.license || "—"}
                        </p>
                        <p>
                            <strong>Años de experiencia:</strong>{" "}
                            {profile.experience || "—"}
                        </p>
                        <p>
                            <strong>Áreas de especialización:</strong>{" "}
                            {profile.specialties || "—"}
                        </p>
                        <p>
                            <strong>Instituciones vinculadas:</strong>{" "}
                            {profile.institutions || "—"}
                        </p>
                    </section>

                    {/* Personal Info */}
                    <section className="grid gap-2">
                        <h3 className="font-semibold text-lg border-b-2 border-black pb-1">
                            Información personal
                        </h3>
                        <p>
                            <strong>Género:</strong> {profile.gender || "—"}
                        </p>
                        <p>
                            <strong>Fecha de nacimiento:</strong>{" "}
                            {profile.birthDate
                                ? format(new Date(profile.birthDate), "PPP")
                                : "—"}
                        </p>
                        <p>
                            <strong>Idiomas hablados:</strong> {profile.languages || "—"}
                        </p>
                        <p>
                            <strong>Biografía:</strong> {profile.bio || "—"}
                        </p>
                    </section>

                    {/* Edit Button + Sheet */}
                    <div className="flex justify-center">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="mt-2">Edit Information</Button>
                            </SheetTrigger>

                            <SheetContent className="bg-[#ffd6d6] border-l-2 border-black overflow-y-auto">
                                <SheetHeader className="px-4 pt-4">
                                    <SheetTitle>Edit profile</SheetTitle>
                                    <SheetDescription>
                                        Make changes to your profile here. Click save when
                                        you&apos;re done.
                                    </SheetDescription>
                                </SheetHeader>

                                <form onSubmit={form.handleSubmit(handleSave)} className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            {...form.register("firstName")}
                                        />
                                        {form.formState.errors.firstName && (
                                            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            {...form.register("lastName")}
                                        />
                                        {form.formState.errors.lastName && (
                                            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            {...form.register("phone")}
                                        />
                                        {form.formState.errors.phone && (
                                            <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="license">License / Certification</Label>
                                        <Input
                                            id="license"
                                            {...form.register("license")}
                                        />
                                        {form.formState.errors.license && (
                                            <p className="text-sm text-destructive">{form.formState.errors.license.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="experience">Years of Experience</Label>
                                        <Input
                                            id="experience"
                                            type="number"
                                            min={0}
                                            max={100}
                                            {...form.register("experience")}
                                        />
                                        {form.formState.errors.experience && (
                                            <p className="text-sm text-destructive">{form.formState.errors.experience.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="specialties">Specialties</Label>
                                        <Input
                                            id="specialties"
                                            {...form.register("specialties")}
                                            placeholder="e.g., Child Psychology, Anxiety Disorders"
                                        />
                                        {form.formState.errors.specialties && (
                                            <p className="text-sm text-destructive">{form.formState.errors.specialties.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="institutions">Institutions</Label>
                                        <Input
                                            id="institutions"
                                            {...form.register("institutions")}
                                            placeholder="e.g., University of X, Hospital Y"
                                        />
                                        {form.formState.errors.institutions && (
                                            <p className="text-sm text-destructive">{form.formState.errors.institutions.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Input
                                            id="gender"
                                            {...form.register("gender")}
                                        />
                                        {form.formState.errors.gender && (
                                            <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="birthDate">Date of Birth</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="neutral"
                                                    type="button"
                                                    className="justify-start text-left font-normal"
                                                >
                                                    {form.watch("birthDate")
                                                        ? format(form.watch("birthDate")!, "PPP")
                                                        : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={form.watch("birthDate") || undefined}
                                                    onSelect={(date) =>
                                                        form.setValue("birthDate", date || null)
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {form.formState.errors.birthDate && (
                                            <p className="text-sm text-destructive">{form.formState.errors.birthDate.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="languages">Languages</Label>
                                        <Input
                                            id="languages"
                                            {...form.register("languages")}
                                            placeholder="e.g., Spanish, English"
                                        />
                                        {form.formState.errors.languages && (
                                            <p className="text-sm text-destructive">{form.formState.errors.languages.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="bio">Short Bio</Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Write a short description..."
                                            {...form.register("bio")}
                                            rows={4}
                                        />
                                        {form.formState.errors.bio && (
                                            <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="profileImage">Profile Image</Label>
                                        <Input
                                            id="profileImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                        {profileImagePreview && (
                                            <div className="mt-2">
                                                <p className="text-sm text-muted-foreground">Preview:</p>
                                                <img
                                                    src={profileImagePreview}
                                                    alt="Preview"
                                                    className="w-24 h-24 object-cover rounded mt-1"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <SheetFooter className="flex flex-col gap-2 px-4 pb-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full"
                                            disabled={isSaving || isUploading}
                                        >
                                            {isSaving || isUploading ? "Saving..." : "Save changes"}
                                        </Button>
                                        <SheetClose asChild>
                                            <Button variant="neutral" type="button" className="w-full">
                                                Close
                                            </Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </form>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
