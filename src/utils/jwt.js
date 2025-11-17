import jwt from "jsonwebtoken";
import { promisify } from "node:util";

const signJwt = promisify(jwt.sign);
const verifyJwt = promisify(jwt.verify);
const SECRET = process.env.MY_APP_SECRET_KEY || "changeme";
const ONE_WEEK_SECONDS = 7 * 24 * 3600;

export function buildAuthToken(user) {
  const exp = Math.floor(Date.now() / 1000) + ONE_WEEK_SECONDS;
  const payload = { sub: user._id.toString(), exp, scope: user.role };
  return signJwt(payload, SECRET);
}

export function verifyAuthToken(token) {
  return verifyJwt(token, SECRET);
}
