import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieSet = vi.fn()

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: cookieSet })),
}))

import { login } from "./actions"

function credentials(username: string, password: string): FormData {
  const formData = new FormData()
  formData.set("username", username)
  formData.set("password", password)
  return formData
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("ADMIN_USERNAME", "admin")
    vi.stubEnv("ADMIN_PASSWORD", "admin-secret")
    vi.stubEnv("FINANCE_USERNAME", "finance")
    vi.stubEnv("FINANCE_PASSWORD", "finance-secret")
  })

  it("authenticates admin users with the admin role", async () => {
    await expect(login(credentials("admin", "admin-secret"))).resolves.toEqual({ success: true })
    expect(cookieSet).toHaveBeenCalledWith("gk_auth", "role_admin", expect.objectContaining({
      httpOnly: true,
      path: "/",
    }))
  })

  it("authenticates finance users with the finance role", async () => {
    await expect(login(credentials("finance", "finance-secret"))).resolves.toEqual({ success: true })
    expect(cookieSet).toHaveBeenCalledWith("gk_auth", "role_finance", expect.objectContaining({
      httpOnly: true,
      path: "/",
    }))
  })

  it("rejects invalid credentials without setting a role cookie", async () => {
    await expect(login(credentials("admin", "wrong-password"))).resolves.toEqual({
      success: false,
      error: "Benutzername oder Passwort ist falsch.",
    })
    expect(cookieSet).not.toHaveBeenCalled()
  })
})
