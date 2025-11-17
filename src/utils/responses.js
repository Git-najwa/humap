export function ok(res, data) {
  return res.status(200).send(data);
}

export function created(res, data) {
  return res.status(201).send(data);
}

export function badRequest(res, message) {
  return res.status(400).send(message);
}

export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).send(message);
}

export function forbidden(res, message = "Forbidden") {
  return res.status(403).send(message);
}

export function notFound(res, message = "Not Found") {
  return res.status(404).send(message);
}
