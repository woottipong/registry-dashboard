import { RegistryForm } from "@/components/registry/registry-form"

export default function NewRegistryPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <RegistryForm mode="create" />
    </section>
  )
}
