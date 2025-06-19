import { z } from "zod";
// Zod schema for user registration validation
export const registerUserSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, "Full name is required")
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),

    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Please provide a valid email address")
        .toLowerCase(),

    username: z
        .string()
        .trim()
        .min(1, "Username is required")
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must not exceed 30 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        )
        .toLowerCase(),

    password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters"),
});
