import { NewWoForm } from "./form";

export default function NewWoPage() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-bgh-700">Nueva Work Order</h1>
      <NewWoForm />
    </div>
  );
}
