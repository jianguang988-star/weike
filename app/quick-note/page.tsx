import QuickNoteForm from "@/components/quick-note-form";

export default function QuickNotePage() {
  return (
    <div className="crm-shell">
      <section className="crm-card">
        <p className="crm-label">快速补充</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">客户有新动作，直接记下来</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          系统会识别对应客户，区分来访、复访、回访，并补充到客户档案。
        </p>
      </section>
      <QuickNoteForm />
    </div>
  );
}
