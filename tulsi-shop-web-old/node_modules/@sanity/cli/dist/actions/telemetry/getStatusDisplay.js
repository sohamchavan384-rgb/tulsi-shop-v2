export function getStatusDisplay(status) {
    switch(status){
        case 'denied':
            {
                return 'Disabled';
            }
        case 'granted':
            {
                return 'Enabled';
            }
        case 'undetermined':
            {
                return 'Undetermined';
            }
        case 'unset':
            {
                return 'Not set';
            }
        default:
            {
                return 'Unknown';
            }
    }
}

//# sourceMappingURL=getStatusDisplay.js.map