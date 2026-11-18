import { describe, it, expect } from "vitest";
import {
  firstEnabledIndex,
  homeIndex,
  endIndex,
  moveIndex,
  pageIndex,
  typeahead,
  placement,
} from "./logic";

describe("Select pure logic", () => {
  const sampleOptions = [
    { value: "1", label: "Alpha", disabled: true },
    { value: "2", label: "Bravo" },
    { value: "3", label: "Charlie", disabled: true },
    { value: "4", label: "Delta" },
    { value: "5", label: "Echo" },
    { value: "6", label: "Foxtrot", disabled: true },
  ];

  it("1. firstEnabledIndex: skips disabled first option and returns first enabled", () => {
    expect(firstEnabledIndex(sampleOptions)).toBe(1);
    expect(firstEnabledIndex([{ label: "One", disabled: true }])).toBe(-1);
    expect(firstEnabledIndex([])).toBe(-1);
  });

  it("2. homeIndex: returns first enabled option", () => {
    expect(homeIndex(sampleOptions)).toBe(1);
    expect(homeIndex([{ label: "A" }, { label: "B" }])).toBe(0);
  });

  it("3. endIndex: returns last enabled option when end edge is disabled", () => {
    expect(endIndex(sampleOptions)).toBe(4); // Echo (index 4) since Foxtrot (index 5) is disabled
    expect(endIndex([{ label: "A", disabled: true }])).toBe(-1);
  });

  it("4. moveIndex: moves forward skipping disabled options", () => {
    // From Bravo (1), next enabled is Delta (3), skipping Charlie (2, disabled)
    expect(moveIndex(sampleOptions, 1, 1)).toBe(3);
  });

  it("5. moveIndex: moves backward skipping disabled options", () => {
    // From Delta (3), previous enabled is Bravo (1), skipping Charlie (2, disabled)
    expect(moveIndex(sampleOptions, 3, -1)).toBe(1);
  });

  it("6. moveIndex: clamps at the end boundary without wrapping", () => {
    // From Echo (4), moving forward clamps at Echo (4) since Foxtrot (5) is disabled
    expect(moveIndex(sampleOptions, 4, 1)).toBe(4);
    expect(moveIndex(sampleOptions, 4, 5)).toBe(4);
  });

  it("7. moveIndex: clamps at the start boundary without wrapping", () => {
    // From Bravo (1), moving backward clamps at Bravo (1) since Alpha (0) is disabled
    expect(moveIndex(sampleOptions, 1, -1)).toBe(1);
    expect(moveIndex(sampleOptions, 1, -5)).toBe(1);
  });

  it("8. pageIndex: jumps 10 steps and clamps", () => {
    const manyOptions = Array.from({ length: 25 }, (_, i) => ({
      label: `Option ${i}`,
      disabled: i % 7 === 0,
    }));
    // Jump down 10 enabled steps (skipping index 7 which is disabled)
    const downResult = pageIndex(manyOptions, 1, "down");
    expect(downResult).toBe(12);

    // Jump up 10 enabled steps from 12 (skipping index 7)
    const upResult = pageIndex(manyOptions, 12, "up");
    expect(upResult).toBe(1);

    // Jump down beyond end clamps to end
    const clampedEnd = pageIndex(manyOptions, 20, 1);
    expect(clampedEnd).toBe(24);
  });

  it("9. typeahead: single letter prefix match from current index", () => {
    const list = [
      { label: "Apple" },
      { label: "Banana" },
      { label: "Cherry" },
      { label: "Date" },
    ];
    // From Apple (0), typing "b" finds Banana (1)
    expect(typeahead(list, 0, "b")).toBe(1);
    // Case-insensitivity: "C" finds Cherry (2)
    expect(typeahead(list, 0, "C")).toBe(2);
  });

  it("10. typeahead: repeated letter typing cycles through options starting with that letter", () => {
    const list = [
      { label: "Avocado" },
      { label: "Banana" },
      { label: "Apricot" },
      { label: "Blueberry" },
      { label: "Apple" },
    ];
    // Currently on Avocado (0), typing "a" cycles to Apricot (2)
    const next1 = typeahead(list, 0, "a");
    expect(next1).toBe(2);
    // Typing "a" again from Apricot (2) cycles to Apple (4)
    const next2 = typeahead(list, 2, "a");
    expect(next2).toBe(4);
    // Typing "a" again wraps to Avocado (0)
    const next3 = typeahead(list, 4, "a");
    expect(next3).toBe(0);

    // Repeated chars in buffer e.g. "aa" also cycles
    expect(typeahead(list, 0, "aa")).toBe(2);
  });

  it("11. typeahead: multi-letter prefix match stays on or finds exact prefix", () => {
    const list = [
      { label: "Angular" },
      { label: "React" },
      { label: "React Native" },
      { label: "Redux" },
      { label: "Vue" },
    ];
    // From Angular (0), typing "re" finds React (1)
    expect(typeahead(list, 0, "re")).toBe(1);
    // Continuing typing "react n" finds React Native (2)
    expect(typeahead(list, 1, "react n")).toBe(2);
  });

  it("12. typeahead: skips disabled options and returns -1 when no match exists", () => {
    const list = [
      { label: "JavaScript", disabled: true },
      { label: "Java" },
      { label: "Julia", disabled: true },
    ];
    // "j" should skip JavaScript (disabled) and match Java (1)
    expect(typeahead(list, -1, "j")).toBe(1);
    // "z" matches nothing -> -1
    expect(typeahead(list, 0, "z")).toBe(-1);
    // empty buffer or empty list -> -1
    expect(typeahead([], 0, "a")).toBe(-1);
  });

  it("13. placement: default bottom placement when ample room below", () => {
    const res = placement({
      triggerRect: { top: 100, bottom: 140 },
      viewportHeight: 800,
      listHeight: 200,
      gap: 6,
      margin: 12,
      maxHeight: 280,
    });
    // roomBelow = 800 - 140 - 6 = 654 >= min(200, 280) = 200
    expect(res.side).toBe("bottom");
    expect(res.maxHeight).toBe(280);
  });

  it("14. placement: flips to top when room below is insufficient and room above is larger", () => {
    const res = placement({
      triggerRect: { top: 600, bottom: 640 },
      viewportHeight: 700,
      listHeight: 250,
      gap: 6,
      margin: 12,
      maxHeight: 280,
    });
    // roomBelow = 700 - 640 - 6 = 54 < 250
    // roomAbove = 600 - 6 = 594 > 54
    expect(res.side).toBe("top");
    expect(res.maxHeight).toBe(280);
  });

  it("15. placement: maxHeight is limited by available room minus margin", () => {
    const res = placement({
      triggerRect: { top: 100, bottom: 140 },
      viewportHeight: 250,
      listHeight: 300,
      gap: 6,
      margin: 12,
      maxHeight: 280,
    });
    // roomBelow = 250 - 140 - 6 = 104
    // roomAbove = 100 - 6 = 94
    // roomBelow > roomAbove, so stays bottom
    // available room = 104 - 12 = 92
    expect(res.side).toBe("bottom");
    expect(res.maxHeight).toBe(92);
  });

  it("16. placement: equal room above and below stays bottom", () => {
    // trigger centered exactly
    const res = placement({
      triggerRect: { top: 200, bottom: 240 },
      viewportHeight: 440,
      listHeight: 300,
      gap: 6,
      margin: 12,
      maxHeight: 280,
    });
    // roomAbove = 200 - 6 = 194
    // roomBelow = 440 - 240 - 6 = 194
    // roomAbove is NOT > roomBelow -> stays bottom
    expect(res.side).toBe("bottom");
  });
});
