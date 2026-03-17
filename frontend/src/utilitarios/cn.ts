import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
    extend: {
        theme: {
            color: [
                "zinc",
                "slate",
                "indigo",
                "emerald"
            ]
        }
    }
})

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs))
}
