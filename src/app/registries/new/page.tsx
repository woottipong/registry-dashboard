import { RegistryForm } from "@/components/registry/registry-form"

export default function NewRegistryPage() {
  return (
    <section className="max-w-3xl">
      <RegistryForm mode="create" />
    </section>
  )
}
