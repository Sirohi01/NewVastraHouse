type PublicPageFrameProps = Readonly<{
  children: React.ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}>;

export function PublicPageFrame({ children, description, eyebrow, title }: PublicPageFrameProps) {
  return (
    <main className="bg-[#fbf7ef]">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 border-t-2 border-[#caa14e] bg-[#fffaf1] px-6 py-7">
          {eyebrow ? (
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#caa14e]">
              <span className="h-px w-6 bg-[#caa14e]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 font-serif text-4xl uppercase leading-tight text-[#3d1620]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f6256]">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    </main>
  );
}
