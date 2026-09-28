export function validateOrganizationName(input) {
    if (!input || input.trim() === '') {
        return 'Organization name cannot be empty';
    } else if (input.length > 100) {
        return 'Organization name cannot be longer than 100 characters';
    }
    return true;
}

//# sourceMappingURL=validateOrganizationName.js.map