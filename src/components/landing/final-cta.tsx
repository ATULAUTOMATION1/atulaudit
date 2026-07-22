import { UrlInputForm } from "./url-input-form";

export function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to improve your website?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Run your free audit now and get a clear roadmap of improvements,
            from quick wins to strategic automation opportunities.
          </p>
        </div>

        <div className="mx-auto mt-8 flex justify-center">
          <UrlInputForm id="audit-form-bottom" />
        </div>
      </div>
    </section>
  );
}
