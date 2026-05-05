import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { vi } from "vitest";

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:test-url");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
