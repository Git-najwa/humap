import { verifyAuthToken } from "../utils/jwt.js";
import { unauthorized } from "../utils/responses.js";

export default async function auth(req, res, next) {
  const authorization = req.get("Authorization");
  if (!authorization) return unauthorized(res, "Authorization header is missing");

  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) return unauthorized(res, "Authorization header is not a bearer token");

  const token = match[1];
  try {
    const payload = await verifyAuthToken(token);
    req.currentUserId = payload.sub;
    req.currentUserPermissions = payload.scope ? payload.scope.split(" ") : [];
    next();
  } catch {
    unauthorized(res, "Your token is invalid or has expired");
  }
}
