import { z } from 'zod/mini';
export function validateEmail(email) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        return 'Email is required';
    }
    const validatedEmail = z.email().safeParse(trimmedEmail);
    if (!validatedEmail.success) {
        return 'Please enter a valid email address';
    }
    return true;
}

//# sourceMappingURL=validateEmail.js.map