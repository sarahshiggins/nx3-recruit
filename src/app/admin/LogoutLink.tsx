"use client";

import { useRouter } from "next/navigation";

export default function LogoutLink() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[var(--text-muted)] text-xs hover:text-[var(--text)] transition-colors"
    >
      Sign out
    </button>
  );
}
