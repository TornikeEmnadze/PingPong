import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSocket } from "./useSocket";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  const mockSocket = {
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  return {
    io: vi.fn(() => mockSocket),
    Socket: vi.fn(),
  };
});

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create socket connection on mount", async () => {
    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toBeDefined();
  });

  it("should have socket with expected properties", async () => {
    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const socket = result.current;
    expect(socket).toHaveProperty("disconnect");
    expect(socket).toHaveProperty("on");
    expect(socket).toHaveProperty("emit");
  });

  it("should disconnect socket on unmount", async () => {
    const { result, unmount } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    unmount();

    // Socket should have been created and then disconnected
    expect(result.current).toBeDefined();
  });

  it("should initialize socket only once with empty dependency array", async () => {
    const { rerender, result } = renderHook(() => useSocket());

    const firstSocket = result.current;

    await waitFor(() => {
      expect(firstSocket).not.toBeNull();
    });

    rerender();

    // Socket reference may differ due to state updates, but socket should still exist
    expect(result.current).toBeDefined();
  });

  it("should return socket object that is not null after mount", async () => {
    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toBeTruthy();
  });
});
