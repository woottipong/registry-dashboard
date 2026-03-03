import { RegistryForm } from "@/components/registry/registry-form"

export default function NewRegistryPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <RegistryForm mode="create" />
    </section>
  )
}
