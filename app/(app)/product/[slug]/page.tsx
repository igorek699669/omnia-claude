import { ProductPage } from "@/pages/product";

export { generateProductMetadata as generateMetadata } from "@/pages/product";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductPage slug={slug} />;
}
