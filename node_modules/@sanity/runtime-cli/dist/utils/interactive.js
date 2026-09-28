function testIsInteractive() {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}
export const isInteractive = testIsInteractive();
