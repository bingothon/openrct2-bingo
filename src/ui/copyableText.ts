const ROW_HEIGHT = 14;
const BUTTON_WIDTH = 45;
const GAP = 5;

/**
 * Plugins can't write to the clipboard, but OpenRCT2 copies a whole text field with Ctrl+C. The
 * Copy button opens OpenRCT2's text dialog with the text already in it, so Ctrl+C copies it.
 */
export function showCopyDialog(title: string, text: string): void {
    ui.showTextInput({
        title,
        description: "Press Ctrl+C to copy, then close this window.",
        initialValue: text,
        maxLength: Math.max(text.length, 1),
        callback: () => {},
    });
}

/**
 * A label with a text field and a Copy button next to it. The field is as wide as the window
 * allows, so long links stay readable.
 */
export function copyableTextWidgets(label: string, text: string, x: number, y: number, width: number): WidgetDesc[] {
    const labelWidth = 70;
    const fieldWidth = width - labelWidth - BUTTON_WIDTH - GAP * 2;
    return [
        { type: "label", text: label, x, y: y + 2, width: labelWidth, height: ROW_HEIGHT },
        { type: "textbox", text, x: x + labelWidth + GAP, y, width: fieldWidth, height: ROW_HEIGHT },
        {
            type: "button",
            text: "Copy",
            x: x + width - BUTTON_WIDTH,
            y,
            width: BUTTON_WIDTH,
            height: ROW_HEIGHT,
            onClick: () => showCopyDialog(`Copy ${label.replace(/:$/, "")}`, text),
        },
    ];
}
