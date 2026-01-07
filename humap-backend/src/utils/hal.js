/**
 * HAL+JSON Hypermedia helpers
 * Adds _links to API responses for HATEOAS compliance
 */

const BASE_URL = process.env.API_BASE_URL || '';

/**
 * Generate HAL links for a single resource
 */
export function halResource(resource, type, additionalLinks = {}) {
  const id = resource._id || resource.id;
  
  const baseLinks = {
    self: { href: `${BASE_URL}/${type}/${id}` },
  };

  // Add type-specific links
  if (type === 'activities') {
    baseLinks.reviews = { href: `${BASE_URL}/activities/${id}/reviews` };
    baseLinks.like = { href: `${BASE_URL}/activities/${id}/like`, method: 'POST' };
    if (resource.user_id) {
      baseLinks.author = { href: `${BASE_URL}/users/${resource.user_id}` };
    }
  }

  if (type === 'reviews') {
    if (resource.activity_id) {
      baseLinks.activity = { href: `${BASE_URL}/activities/${resource.activity_id}` };
    }
    if (resource.user_id) {
      baseLinks.author = { href: `${BASE_URL}/users/${resource.user_id}` };
    }
  }

  if (type === 'users') {
    baseLinks.activities = { href: `${BASE_URL}/users/${id}/activities` };
  }

  return {
    ...resource.toObject ? resource.toObject() : resource,
    _links: { ...baseLinks, ...additionalLinks },
  };
}

/**
 * Generate HAL links for a paginated collection
 */
export function halCollection(items, type, pagination, baseQuery = '') {
  const { page, limit, total, totalPages } = pagination;
  
  const queryString = baseQuery ? `&${baseQuery}` : '';
  
  const links = {
    self: { href: `${BASE_URL}/${type}?page=${page}&limit=${limit}${queryString}` },
    first: { href: `${BASE_URL}/${type}?page=1&limit=${limit}${queryString}` },
    last: { href: `${BASE_URL}/${type}?page=${totalPages}&limit=${limit}${queryString}` },
  };

  if (page > 1) {
    links.prev = { href: `${BASE_URL}/${type}?page=${page - 1}&limit=${limit}${queryString}` };
  }

  if (page < totalPages) {
    links.next = { href: `${BASE_URL}/${type}?page=${page + 1}&limit=${limit}${queryString}` };
  }

  return {
    _embedded: {
      [type]: items.map(item => halResource(item, type)),
    },
    _links: links,
    page,
    limit,
    total,
    totalPages,
  };
}

/**
 * Build query string from request query params (excluding pagination)
 */
export function buildQueryString(query) {
  const params = { ...query };
  delete params.page;
  delete params.limit;
  
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}
