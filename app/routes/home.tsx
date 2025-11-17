import type { Route } from "./+types/home";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { 
    Rocket, 
    LogIn,
    Heart, 
    BarChart3, 
    Users, 
    Shield, 
    Brain, 
    TrendingUp,
    CheckCircle2,
    ArrowRight,
    FileText,
    Calendar,
    MessageSquare,
    Sparkles
} from "lucide-react";

import { IconCloudBackground } from "~/components/ui/icon-cloud-background";
import {useAuthActions} from "@convex-dev/auth/react";
import {Link} from "react-router";
import { useOutletContext } from "react-router";
import { SiteHeader } from "~/components/site-header";

export default function Home() {
    const { user } = useOutletContext<{ user: any }>()

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Insights",
            description: "Advanced emotion detection and analysis to understand your child's emotional patterns and trends."
        },
        {
            icon: BarChart3,
            title: "Progress Tracking",
            description: "Visual charts and reports showing emotional well-being progress over time with actionable insights."
        },
        {
            icon: Users,
            title: "Collaborative Care",
            description: "Seamless communication between parents and therapists for comprehensive child support."
        },
        {
            icon: Shield,
            title: "Privacy & Security",
            description: "Your child's data is protected with enterprise-grade security and privacy measures."
        },
        {
            icon: FileText,
            title: "Detailed Reports",
            description: "Comprehensive assessment reports with recommendations and downloadable PDFs for your records."
        },
        {
            icon: Calendar,
            title: "Session Management",
            description: "Schedule and track therapy sessions with integrated calendar and reminder system."
        }
    ]

    const benefits = [
        {
            title: "For Parents",
            items: [
                "Real-time insights into your child's emotional state",
                "Daily personalized recommendations",
                "Access to all assessment reports and progress charts",
                "Direct communication with your child's therapist",
                "Easy-to-understand visualizations and trends"
            ]
        },
        {
            title: "For Therapists",
            items: [
                "Comprehensive child profiles and history",
                "Advanced emotion tracking and analysis tools",
                "Rich report creation with multimedia support",
                "Session scheduling and management",
                "Data-driven insights for better treatment plans"
            ]
        }
    ]

    const steps = [
        {
            number: "01",
            title: "Sign Up",
            description: "Create your account as a parent or therapist and set up your profile."
        },
        {
            number: "02",
            title: "Connect",
            description: "Parents can link their children, therapists can view their assigned cases."
        },
        {
            number: "03",
            title: "Track & Analyze",
            description: "Monitor emotional well-being through assessments, charts, and AI-powered insights."
        },
        {
            number: "04",
            title: "Collaborate",
            description: "Work together to support the child's journey with shared reports and recommendations."
        }
    ]

    return (
        <>
            <SiteHeader user={user} />
            <div className="relative mx-auto my-10 max-w-7xl flex-col items-center justify-center">
                <IconCloudBackground />

            <div className="absolute inset-y-0 left-0 h-full w-px">
                <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent to-transparent" />
            </div>
            <div className="absolute inset-y-0 right-0 h-full w-px ">
                <div className="absolute h-40 w-px bg-gradient-to-b from-transparent to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px w-full">
                <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent to-transparent" />
            </div>

            <div className="relative z-10 px-4 py-10 md:py-20">
                {/* Hero Section */}
                <div className="mb-32">
                    <h1 className="mx-auto max-w-4xl text-center text-2xl font-bold md:text-4xl text-rose-600 lg:text-7xl dark:text-slate-300">
                        {"Nurture your child's emotional well-being"
                            .split(" ")
                            .map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1,
                                        ease: "easeInOut",
                                    }}
                                    className="mr-2 inline-block"
                                >
                                    {word}
                                </motion.span>
                            ))}
                    </h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                        className="mx-auto max-w-xl py-4 text-center text-lg font-normal text-foreground-600 dark:text-neutral-400"
                    >
                        With AI, you gain compassionate insights into your child's emotional health. Our platform helps parents and therapists collaboratively support their journey to resilience and understanding.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1 }}
                        className="mt-8 flex flex-wrap items-center justify-center gap-4"
                    >
                        <Button className="w-60 transform px-6 py-2 font-medium text-base">
                            <Rocket className="mr-2 h-5 w-5" />
                            <Link to={!user ? "/role" : user.role === "therapist" ? "/therapist" : "/parent"}>
                                Get Started
                            </Link>
                        </Button>
                        <Button variant="neutral" className="w-60 transform px-6 py-2 font-medium text-base" asChild>
                            <Link to="/sign-in">
                                <LogIn className="mr-2 h-5 w-5" />
                                Sign In
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Features Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-32"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to support your child's emotional well-being in one comprehensive platform
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="h-full border-2 border-rose-500/40 hover:border-rose-500/60 transition-colors bg-rose-50/40 dark:bg-rose-950/30 hover:shadow-lg">
                                    <CardHeader>
                                        <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-4">
                                            <feature.icon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Benefits Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-32"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Designed for Everyone</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Tailored experiences for both parents and therapists
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="h-full border-2 border-rose-500/40 hover:border-rose-500/60 transition-colors bg-rose-50/40 dark:bg-rose-950/30">
                                    <CardHeader>
                                        <CardTitle className="text-2xl">{benefit.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {benefit.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-muted-foreground">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* How It Works Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-32"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Get started in just a few simple steps
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative"
                            >
                                <Card className="h-full border-2 border-rose-500/40 hover:border-rose-500/60 transition-colors bg-rose-50/40 dark:bg-rose-950/30">
                                    <CardHeader>
                                        <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">{step.number}</div>
                                        <CardTitle>{step.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{step.description}</CardDescription>
                                    </CardContent>
                                </Card>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Stats Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-32"
                >
                    <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-2 border-rose-500/40">
                        <CardContent className="p-12">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                <div>
                                    <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">6</div>
                                    <div className="text-muted-foreground">Emotions Tracked</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">24/7</div>
                                    <div className="text-muted-foreground">Monitoring</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">AI</div>
                                    <div className="text-muted-foreground">Powered Insights</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">100%</div>
                                    <div className="text-muted-foreground">Privacy Focused</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-20"
                >
                    <Card className="bg-gradient-to-r from-rose-500/20 to-rose-500/10 border-2 border-rose-500/40">
                        <CardContent className="p-12 text-center">
                            <Sparkles className="h-12 w-12 text-rose-600 dark:text-rose-400 mx-auto mb-4" />
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join parents and therapists who are already using our platform to support children's emotional well-being.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Button size="lg" className="w-60 transform px-6 py-2 font-medium text-base">
                                    <Rocket className="mr-2 h-5 w-5" />
                                    <Link to={!user ? "/role" : user.role === "therapist" ? "/therapist" : "/parent"}>
                                        Start Your Journey
                                    </Link>
                                </Button>
                                <Button variant="neutral" size="lg" className="w-60 transform px-6 py-2 font-medium text-base">
                                    <MessageSquare className="mr-2 h-5 w-5" />
                                    Contact Support
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>
            </div>
        </div>
        </>
    );
}