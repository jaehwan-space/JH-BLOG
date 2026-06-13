import Link from "next/link";

type InsightCardProps = {
  title: string;
  description: string;
  href?: string;
  meta?: string;
  tone?: "blue" | "neutral";
};

export function InsightCard({ title, description, href, meta, tone = "blue" }: InsightCardProps) {
  const content = (
    <div className={`insight-card ${tone === "blue" ? "insight-card-blue" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="insight-mark" aria-hidden="true" />
        {meta ? <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-strong">{meta}</span> : null}
      </div>
      <div>
        <h3 className="text-lg font-black leading-snug text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link className="block transition hover:-translate-y-0.5" href={href}>
      {content}
    </Link>
  );
}
