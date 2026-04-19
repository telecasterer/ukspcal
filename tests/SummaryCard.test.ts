// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import SummaryCard from "../src/lib/components/SummaryCard.svelte";

describe("SummaryCard", () => {
    const result = {
        ni: "00A",
        normalDay: "Monday",
        cycleDays: 28,
        payments: [],
    };

    it("renders embedded summary", () => {
        const { getByText } = render(SummaryCard, {
            props: { result, embedded: true },
        });
        expect(getByText("Schedule summary")).toBeInTheDocument();
        expect(getByText("Monday")).toBeInTheDocument();
    });

    it("renders standalone summary", () => {
        const { getByText } = render(SummaryCard, {
            props: { result, embedded: false },
        });
        expect(getByText("Schedule summary")).toBeInTheDocument();
        expect(getByText("Monday")).toBeInTheDocument();
    });
});
