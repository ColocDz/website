export function parseJsonField(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function stringifyJsonField(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return JSON.stringify(val);
  return JSON.stringify(val || []);
}

export function formatPost(post: any): any {
  if (!post) return post;
  return {
    ...post,
    images: parseJsonField(post.images),
    amenities: parseJsonField(post.amenities),
    rules: parseJsonField(post.rules),
    necessities: parseJsonField(post.necessities),
    tags: parseJsonField(post.tags),
  };
}
