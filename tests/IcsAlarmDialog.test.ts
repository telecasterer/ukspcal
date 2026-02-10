// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import IcsAlarmDialogHarness from "./IcsAlarmDialogHarness.svelte";

describe("IcsAlarmDialog", () => {
    it("renders and emits save", async () => {
        const saveHandler = vi.fn();
        const { getByText } = render(IcsAlarmDialogHarness, {
            props: {
                onSave: saveHandler,
            },
        });

        await fireEvent.click(getByText("Save"));
        expect(saveHandler).toHaveBeenCalled();
    });
});
