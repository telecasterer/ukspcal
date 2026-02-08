export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to legacy method
        }
    }

    if (typeof document === "undefined") return false;

    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
    } catch {
        return false;
    }
}

export async function copyLinkToClipboard(url?: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const link = url ?? window.location.href;
    return copyTextToClipboard(link);
}
