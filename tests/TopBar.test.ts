// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import TopBar from "../src/lib/components/TopBar.svelte";

describe("TopBar", () => {
    it("renders title and icon", () => {
        const { getByText, container } = render(TopBar, {
            props: { title: "Pension Calendar" }
        });
        expect(getByText("Pension Calendar")).toBeInTheDocument();
        const img = container.querySelector("img");
        expect(img).toBeInTheDocument();
    });

    it("shows in-app banner when enabled", () => {
        const { getByText } = render(TopBar, {
            props: { title: "Pension Calendar", showInAppBanner: true }
        });
        expect(getByText(/Tip: this app works best/i)).toBeInTheDocument();
    });
});
