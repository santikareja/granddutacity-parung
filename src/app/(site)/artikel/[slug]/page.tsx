import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyArtikelSlugRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  redirect(`/${slug}`);
}
