// ~/components/ui/icon-cloud-background.tsx
import ImageCard from "~/components/ui/image-card"
import { useMemo } from "react";
import { motion } from "motion/react";
import { Heart, BrainCircuit, Smile, Users, ShieldCheck } from "lucide-react";

// Helper function to generate a random number in a range
const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

// A list of icon components and their properties
const iconList = [
    { component: Heart, color: "text-rose-200/40 dark:text-rose-900/40", filled: true },
    { component: BrainCircuit, color: "text-sky-200/40 dark:text-sky-900/40" },
    { component: Smile, color: "text-yellow-200/40 dark:text-yellow-900/40" },
    { component: ShieldCheck, color: "text-green-200/40 dark:text-green-900/40" },
    { component: Users, color: "text-indigo-200/40 dark:text-indigo-900/40" },
];

export function IconCloudBackground() {
    const icons = useMemo(() => {
        return Array.from({ length: 40 }).map((_, index) => {
            const IconData = iconList[index % iconList.length];
            const size = getRandom(20, 80);

            return {
                id: index,
                Icon: IconData.component,
                color: IconData.color,
                filled: IconData.filled,
                style: {
                    position: 'absolute' as const,
                    top: `${getRandom(-20, 100)}%`,
                    left: `${getRandom(-20, 100)}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                },
                animation: {
                    y: [0, getRandom(-20, -5), 0],
                    x: [0, getRandom(-10, 10), 0],
                },
                // The entire transition object is now correctly typed
                transition: {
                    duration: getRandom(8, 20),
                    delay: getRandom(0, 10),
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                },
            };
        });
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-0 h-full w-full">
            {icons.map(icon => (
                <motion.div
                    key={icon.id}
                    style={icon.style}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1, ...icon.animation }}
                    transition={icon.transition}
                >
                    <icon.Icon
                        className={`h-full w-full ${icon.color}`}
                        fill={icon.filled ? "currentColor" : "none"}
                        strokeWidth={1}
                    />
                </motion.div>
            ))}
        </div>
    );
}