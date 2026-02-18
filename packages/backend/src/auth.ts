import { loginSchema, validateFormData } from "./lib/validation";
import { generateToken } from "./lib/jwt";
import { practitioners, authSessions } from "@workspace/database";
import { verifyPassword } from "./lib/passwordUtils";

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}

export interface AuthResult {
  isAuthenticated: boolean;
  session?: AuthSession;
  redirectUrl?: string;
}

export async function login(request: Request) {
  try {
    const formData = await request.formData();
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validation = validateFormData(loginSchema, data);
    if (!validation.success) {
      return new Response(JSON.stringify({ success: false, errors: validation.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validation.data;
    const user = await practitioners.findByEmail(email);
    if (!user || !user.password_hash) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    await authSessions.create(user.id, token);

    const response = new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    response.headers.set(
      "Set-Cookie",
      `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    );
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function logout(request: Request) {
  try {
    const cookies = request.headers.get("cookie");
    const tokenMatch = cookies?.match(/auth-token=([^;]+)/);
    const token = tokenMatch?.[1];
    if (token) {
      await authSessions.delete(token);
    }

    const response = new Response(
      JSON.stringify({ success: true, message: "Logged out successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    response.headers.set(
      "Set-Cookie",
      "auth-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    );
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function validateAuthentication(
  request: Request,
  redirectPath?: string,
): Promise<AuthResult> {
  try {
    const cookies = request.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/(?:^|;)\s*auth-token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      const url = new URL(request.url);
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("next", redirectPath || `${url.pathname}${url.search}`);
      return { isAuthenticated: false, redirectUrl: loginUrl.toString() };
    }

    const session = await authSessions.findByToken(token);
    if (!session) {
      return { isAuthenticated: false, redirectUrl: "/login" };
    }

    const practitioner = await practitioners.findById(session.user_id);
    if (!practitioner) {
      return { isAuthenticated: false, redirectUrl: "/login" };
    }

    return {
      isAuthenticated: true,
      session: {
        userId: practitioner.id,
        email: practitioner.email,
        name: practitioner.name,
      },
    };
  } catch {
    return { isAuthenticated: false, redirectUrl: "/login" };
  }
}
