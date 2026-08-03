import type { ReactNode } from "react";

interface HorizontalShelfProps {
  title: string;
  children: ReactNode;
}

export function HorizontalShelf({ title, children }: HorizontalShelfProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-am-text">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>
    </section>
  );
}
