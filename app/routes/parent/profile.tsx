"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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
import { format } from "date-fns"
import { toast } from "sonner"
import type { Id } from "convex/_generated/dataModel"
import { useNavigate } from "react-router"

export default function ParentProfile() {
    const profile = useQuery(api.parents.getParentProfile)
    const children = useQuery(api.parents.getParentChildren)
    const updateProfile = useMutation(api.parents.updateParentProfile)
    const generateUploadUrl = useMutation(api.report.generateUploadUrl)
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    })
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [profileImagePreview, setProfileImagePreview] = useState<string>("")
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phone: profile.phone || "",
            })
        }
    }, [profile])

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

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

    const handleSave = async () => {
        setIsSaving(true)
        try {
            let profilePictureId: Id<"_storage"> | undefined = undefined

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

            await updateProfile({
                firstName: formData.firstName || undefined,
                lastName: formData.lastName || undefined,
                phone: formData.phone || undefined,
                profilePicture: profilePictureId,
            })

            toast.success("Profile updated successfully")
            setProfileImageFile(null)
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
    const getProfileImageUrl = (storageId: Id<"_storage"> | undefined) => {
        if (!storageId) return null
        return `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`
    }

    const profileImageUrl = getProfileImageUrl(profile.profilePicture)

    return (
        <div className="w-full flex justify-center mt-8">
            <Card className="w-full max-w-4xl border-2 border-black shadow-[4px_4px_0_0_#000]">
                <CardHeader className="flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4 rounded-full border-2 border-black overflow-hidden bg-white shadow-[3px_3px_0_0_#000]">
                        {profileImagePreview ? (
                            <img
                                src={profileImagePreview}
                                alt="Profile"
                                className="object-cover w-full h-full"
                            />
                        ) : profileImageUrl ? (
                            <img
                                src={profileImageUrl}
                                alt="Profile"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm">
                                No Image
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">Manage your information</p>
                </CardHeader>

                <CardContent className="grid gap-8 px-8 py-4">
                    {/* Parent Info */}
                    <section className="grid gap-2">
                        <h3 className="font-semibold text-lg border-b-2 border-black pb-1">
                            Personal Information
                        </h3>
                        <p>
                            <strong>Email:</strong> {profile.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {profile.phone || "—"}
                        </p>
                    </section>

                    {/* Children Information */}
                    <section className="grid gap-2">
                        <h3 className="font-semibold text-lg border-b-2 border-black pb-1">
                            Your Children
                        </h3>
                        {!children || children.length === 0 ? (
                            <p className="text-muted-foreground">No children registered.</p>
                        ) : (
                            <div className="space-y-4">
                                {children.map((child) => (
                                    <Card key={child._id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">
                                                    {child.firstName} {child.lastName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Age {child.age} • {child.course}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Last Assessment:{" "}
                                                    {child.lastEvaluationDate
                                                        ? format(
                                                              new Date(child.lastEvaluationDate),
                                                              "MMM d, yyyy"
                                                          )
                                                        : "Never"}
                                                </p>
                                            </div>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(
                                                        `/parent/assessments?childId=${child._id}`
                                                    )
                                                }
                                            >
                                                View Reports →
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
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

                                <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                handleChange("firstName", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                handleChange("lastName", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                handleChange("phone", e.target.value)
                                            }
                                        />
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
                                </div>

                                <SheetFooter className="flex flex-col gap-2 px-4 pb-4">
                                    <Button
                                        type="button"
                                        className="w-full"
                                        onClick={handleSave}
                                        disabled={isSaving || isUploading}
                                    >
                                        {isSaving || isUploading ? "Saving..." : "Save changes"}
                                    </Button>
                                    <SheetClose asChild>
                                        <Button variant="neutral" className="w-full">
                                            Close
                                        </Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}



