export const canViewPost = (post, viewerId) => {
  const owner = post.user;
  const ownerId = typeof owner === "object" && owner !== null ? owner._id : owner;

  if (String(ownerId) === String(viewerId)) return true;

  const visibility = post.visibility || "public";

  if (visibility === "public") return true;
  if (visibility === "private") return false;

  if (visibility === "followers") {
    if (!owner || typeof owner !== "object" || !Array.isArray(owner.followers)) {
      return false;
    }
    return owner.followers.some((id) => String(id) === String(viewerId));
  }

  return false;
};

export const ALLOWED_VISIBILITIES = ["public", "followers", "private"];