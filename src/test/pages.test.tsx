import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("HomePage", () => {
  it("renders CBTI brand name", () => {
    render(<Home />);
    expect(screen.getByText("CBTI")).toBeInTheDocument();
  });

  it("renders tagline about crypto personality test", () => {
    render(<Home />);
    expect(
      screen.getByText(/加密持仓者类型指数/)
    ).toBeInTheDocument();
  });

  it("renders start quiz button with link to /quiz", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /开始测试/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/quiz");
  });
});

describe("QuizPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", async () => {
    // Mock fetch to hang so we see loading state
    global.fetch = vi.fn(
      () => new Promise(() => {})
    ) as unknown as typeof fetch;

    // Dynamic import to avoid module-level fetch calls
    const { default: QuizPage } = await import("@/app/quiz/page");
    render(<QuizPage />);
    expect(screen.getByText(/正在加载题目/)).toBeInTheDocument();
  });
});
