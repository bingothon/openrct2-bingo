/**
 * Inserts line breaks in the goal name at the closest word boundaries so each line fits within a specified max width.
 * @param {string} name - The original name of the goal.
 * @returns {string} - Modified name with line breaks.
 */
export function addLineBreak(name: string): string {
    const maxWidth = 15;
    let result = "";
    let remainingText = name;

    while (remainingText.length > maxWidth) {
        let breakPoint = remainingText.lastIndexOf(" ", maxWidth);

        // If no space found within max width, try finding the next space after max width
        if (breakPoint === -1) {
            breakPoint = remainingText.indexOf(" ", maxWidth);
        }

        // If no suitable space found, break exactly at max width
        if (breakPoint === -1) {
            breakPoint = maxWidth;
        }

        // Add the line to the result and remove the processed part from remaining text
        result += remainingText.slice(0, breakPoint) + "\n";
        remainingText = remainingText.slice(breakPoint + 1); // Remove space at the break point
    }

    // Add any remaining text that fits within max width
    result += remainingText;

    return result;
}
