// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import HelpPage from "../src/routes/help/+page.svelte";
import ClaimingPage from "../src/routes/claiming/+page.svelte";
import PrivacyPage from "../src/routes/privacy/+page.svelte";

vi.mock("$app/state", () => ({
    page: {
        get url() {
            return new URL("https://ukspcal.vercel.app/claiming?spaDate=2027-09-06");
        },
    },
}));

function contentsLinks(container: HTMLElement): HTMLAnchorElement[] {
    return Array.from(
        container.querySelectorAll<HTMLAnchorElement>(
            'nav[aria-labelledby="doc-contents-heading"] a'
        )
    );
}

function expectLinksLandOnHeadings(container: HTMLElement): void {
    const links = contentsLinks(container);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
        const target = container.querySelector(link.getAttribute("href")!);
        expect(target?.tagName).toBe("H2");
        expect(target?.textContent?.trim()).toBe(link.textContent?.trim());
    }
}

describe("document pages", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("shows Help as one readable page with contents links, not collapsed sections", () => {
        const { container, getByRole } = render(HelpPage);

        expect(container.querySelector("details")).toBeNull();
        expect(contentsLinks(container).map((a) => a.textContent?.trim())).toEqual(
            expect.arrayContaining(["Quick Start", "How Calculations Work", "Official Sources"])
        );
        expectLinksLandOnHeadings(container);
        // Previously hidden inside a collapsed subsection.
        expect(container.textContent).toContain("England & Wales is the default UK holiday set");
        expect(getByRole("button", { name: "Share this page" })).toBeInTheDocument();
    });

    it("gives Claiming contents links for each place people live, and a Share button", () => {
        const { container, getByRole } = render(ClaimingPage);

        expect(contentsLinks(container).map((a) => a.textContent?.trim())).toEqual(
            expect.arrayContaining([
                "If you live in England, Scotland or Wales",
                "If you live in Northern Ireland",
                "If you live elsewhere (Non-UK residents)",
            ])
        );
        expectLinksLandOnHeadings(container);
        expect(getByRole("button", { name: "Share this page" })).toBeInTheDocument();
    });

    it("places the invitation letter note with the UK and Northern Ireland sections", () => {
        const { container, getByRole } = render(ClaimingPage);

        const note = getByRole("note");
        const northernIreland = container.querySelector("#if-you-live-in-northern-ireland")!;
        const overseas = container.querySelector("#if-you-live-elsewhere-non-uk-residents")!;
        expect(note).toHaveTextContent("No invitation letter? (UK and Northern Ireland)");
        expect(
            northernIreland.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(
            note.compareDocumentPosition(overseas) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(container.innerHTML).not.toContain("doc-insert");
    });

    it("shows a floating Back to top button once the contents list scrolls away", async () => {
        const observers: Array<{
            callback: IntersectionObserverCallback;
            targets: Element[];
        }> = [];
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                targets: Element[] = [];
                constructor(callback: IntersectionObserverCallback) {
                    observers.push({ callback, targets: this.targets });
                }
                observe(target: Element) {
                    this.targets.push(target);
                }
                disconnect() {}
            }
        );
        const scrollTo = vi.fn();
        vi.stubGlobal("scrollTo", scrollTo);

        const { getAllByRole, getByRole } = render(HelpPage);

        // Only the button at the end of the card is visible at first.
        expect(getAllByRole("button", { name: "Back to top" })).toHaveLength(1);

        const { callback, targets } = observers.at(-1)!;
        callback(
            targets.map((target) => ({ target, isIntersecting: false })) as unknown as IntersectionObserverEntry[],
            {} as IntersectionObserver
        );

        await vi.waitFor(() => {
            expect(getAllByRole("button", { name: "Back to top" })).toHaveLength(2);
        });
        await fireEvent.click(getAllByRole("button", { name: "Back to top" })[1]);
        expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
        expect(getByRole("heading", { level: 1, name: "Help & guidance" })).toHaveFocus();
    });

    it("keeps Privacy as a short page without contents, Share or Back to top", () => {
        const { container, getByRole, queryByRole } = render(PrivacyPage);

        expect(getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
        expect(contentsLinks(container)).toHaveLength(0);
        expect(queryByRole("button", { name: "Share this page" })).toBeNull();
        expect(queryByRole("button", { name: "Back to top" })).toBeNull();
    });
});
