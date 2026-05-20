import CustomerInputForm from "@/components/customer-input-form";

export default function NewCustomerPage() {
  return (
    <div className="crm-shell">
      <section className="crm-card">
        <p className="crm-label">新增客户</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">把销售口述变成客户档案</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          粘贴销售口语化描述，系统会提取客户档案、到访记录和下一步跟进建议。
        </p>
      </section>
      <CustomerInputForm />
    </div>
  );
}
