export default defineEventHandler(async (event): Promise<string> => {
  const config = useRuntimeConfig();
  const response = await fetch(`${config.apiInternalBase}/sitemap.xml`);
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return response.text();
});
