import { Search, Plus, ArrowUpRight } from 'lucide-react';
import { Button, Input, Card, CardHeader, Avatar, Logo } from '../features/ui';

// Phase 0 — visual sandbox to verify the design tokens.
// Delete once the dashboard exists.
export default function StylePreview() {
  return (
    <div className="min-h-screen bg-surface px-8 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex items-center justify-between">
          <Logo size="lg" />
          <span className="text-sm text-ink-muted">Phase 0 · Design system preview</span>
        </header>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add widget</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Inputs</h2>
          <div className="grid max-w-xl grid-cols-1 gap-4">
            <Input label="Email" placeholder="you@company.com" />
            <Input label="Search" placeholder="Search employees" leftIcon={<Search className="h-4 w-4" />} />
            <Input label="Password" type="password" error="Password must be at least 8 characters" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Card + stat tile</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader title="Active Jobs" subtitle="24 open" action={<ArrowUpRight className="h-5 w-5 text-brand-500" />} />
              <p className="mt-3 text-sm text-ink-muted">
                A standard card. Use for panels and tiles.
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <div className="rounded-2xl bg-surface-muted p-2.5">
                  <div className="h-6 w-6 rounded-md bg-brand-500" />
                </div>
                <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                  +3.72%
                </span>
              </div>
              <div className="mt-5">
                <div className="text-2xl font-semibold tracking-tight">310</div>
                <div className="text-sm text-ink-muted">Total Employees</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <div className="rounded-2xl bg-surface-muted p-2.5">
                  <div className="h-6 w-6 rounded-md bg-brand-500" />
                </div>
                <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700">
                  -1.72%
                </span>
              </div>
              <div className="mt-5">
                <div className="text-2xl font-semibold tracking-tight">1,298</div>
                <div className="text-sm text-ink-muted">Resigned</div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Avatars</h2>
          <div className="flex items-center gap-3">
            <Avatar name="Kennedy Jones" size="sm" />
            <Avatar name="Ruben Philips" size="md" />
            <Avatar name="Charlie Korsgaard" size="lg" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Brand swatches</h2>
          <div className="flex flex-wrap gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
              <div key={step} className="flex flex-col items-center text-xs">
                <div
                  className="h-14 w-14 rounded-xl ring-1 ring-border"
                  style={{ backgroundColor: `var(--color-brand-${step})` }}
                />
                <span className="mt-1 text-ink-muted">brand-{step}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
