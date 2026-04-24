import { NewUserForm } from "./form";

export default function NewUserPage() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-bgh-700">Nuevo usuario</h1>
      <NewUserForm />
    </div>
  );
}
