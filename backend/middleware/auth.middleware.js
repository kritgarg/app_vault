import { auth } from "../utils/auth.js";

/**
 * Express middleware to enforce authentication using Better Auth.
 * Automatically fetches the active session from headers and attaches
 * the authenticated `user` and `session` objects to the request.
 */
export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    // If no session exists, reject the request with 401 Unauthorized
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: No active session found" });
    }

    // Attach user and session context to the request for downstream controllers
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
}
