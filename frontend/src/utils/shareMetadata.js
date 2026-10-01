const setMeta = (attribute, key, value) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
};

export const setShareMetadata = ({ title, description, url, image, imageAlt, type = "website", username }) => {
  if (typeof document === "undefined") return;
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:site_name", "Spools");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", image);
  setMeta("property", "og:image:alt", image ? imageAlt || title : null);
  setMeta("property", "profile:username", username);
  setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", image);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
};
