import { RfqForm } from "@/components/rfq-form";
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Nova solicitação</h1>
      <RfqForm />
    </main>
  );
}
