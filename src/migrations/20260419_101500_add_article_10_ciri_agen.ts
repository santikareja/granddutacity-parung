import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

const ARTICLE_SLUG = '10-ciri-agen-properti-terbaik'
const ARTICLE_CONTENT = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Pasar properti Indonesia di tahun 2026 telah bertransformasi menjadi ekosistem yang sangat kompleks. Dengan fluktuasi harga yang dinamis di kawasan sunrise area seperti IKN, Jabodetabek, hingga koridor timur Jawa, melakukan transaksi properti sendirian tanpa pendamping ahli adalah langkah yang berisiko tinggi.',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            text: '10 Kriteria Utama Agen Properti Terbaik di Indonesia',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '1. Memiliki Kredensial dan Lisensi Resmi (AREBI & LSP)',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '2. Rekam Jejak (Track Record) yang Solid dan Terverifikasi',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '3. Penguasaan Pasar Lokal (Hyper-Local Expertise)',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '4. Keterampilan Komunikasi yang Efektif dan Proaktif',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '5. Jaringan Luas (The Power of Networking)',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '6. Kemampuan Negosiasi yang Tajam dan Etis',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '7. Pemanfaatan Teknologi Modern & PropTech',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '8. Integritas dan Transparansi Tanpa Syarat',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '9. Pendekatan Berorientasi pada Solusi (Problem Solver)',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: '10. Komitmen pada Edukasi Klien (Consultative Selling)',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            text: 'Cara Memverifikasi Agen Properti Sebelum Bekerja Sama',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            text: 'Kesimpulan: Keamanan Transaksi Adalah Prioritas Utama',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Ensure tags exist
  const tagsToEnsure = [
    { name: 'Agen', slug: 'agen' },
    { name: 'Pemasaran', slug: 'pemasaran' },
    { name: 'Agen Properti', slug: 'agen-properti' },
  ]
  const tagIds: number[] = []
  for (const t of tagsToEnsure) {
    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: t.slug } },
      limit: 1,
      req,
    })
    if (existing.docs.length > 0) {
      tagIds.push(existing.docs[0].id as number)
    } else {
      const created = await payload.create({
        collection: 'tags',
        data: t,
        req,
      })
      tagIds.push(created.id as number)
    }
  }

  // 2. Ensure Category exists
  const catRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'panduan-properti' } },
    limit: 1,
    req,
  })
  let categoryId: number
  if (catRes.docs.length > 0) {
    categoryId = catRes.docs[0].id as number
  } else {
    const createdCat = await payload.create({
      collection: 'categories',
      data: { name: 'Panduan Properti', slug: 'panduan-properti' },
      req,
    })
    categoryId = createdCat.id as number
  }

  // 3. Get Media ID
  const mediaRes = await payload.find({
    collection: 'media',
    where: { url: { equals: 'https://res.cloudinary.com/dzhvfbuks/image/upload/v1776585039/10_Ciri_Agen_Properti_Terbaik_qnwhni.webp' } },
    limit: 1,
    req,
  })
  let mediaId: number | undefined = mediaRes.docs[0]?.id as number
  if (!mediaId) {
    const fallbackMedia = await payload.find({ collection: 'media', limit: 1, req })
    mediaId = fallbackMedia.docs[0]?.id as number
  }

  // 4. Upsert Article using Payload API
  const currentYear = new Date().getFullYear()
  const articleData = {
    title: '10 Ciri Agen Properti Terbaik: Panduan Lengkap Memilih Mitra Jual Beli Rumah Anda',
    slug: ARTICLE_SLUG,
    excerpt: 'Temukan rahasia memilih agen properti terbaik untuk transaksi jual beli rumah Anda. Pelajari 10 ciri utama yang harus dimiliki agen profesional.',
    content: ARTICLE_CONTENT as any,
    featuredImage: mediaId,
    kategori: [categoryId],
    tags: tagIds,
    seo: {
      metaTitle: `10 Ciri Agen Properti Terbaik: Panduan Lengkap ${currentYear}`,
      metaDescription: 'Temukan rahasia memilih agen properti terbaik untuk transaksi jual beli rumah Anda. Pelajari 10 ciri utama yang harus dimiliki agen profesional.',
      focusKeyword: 'Agen Properti Terbaik',
    },
    status: 'published' as const,
    publishedAt: new Date().toISOString(),
    aiGenerated: true,
  }

  const existingArticle = await payload.find({
    collection: 'artikel',
    where: { slug: { equals: ARTICLE_SLUG } },
    limit: 1,
    req,
  })

  if (existingArticle.docs.length > 0) {
    await payload.update({
      collection: 'artikel',
      id: existingArticle.docs[0].id,
      data: articleData,
      req,
    })
  } else {
    await payload.create({
      collection: 'artikel',
      data: articleData,
      req,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const existingArticle = await payload.find({
    collection: 'artikel',
    where: { slug: { equals: ARTICLE_SLUG } },
    limit: 1,
    req,
  })

  if (existingArticle.docs.length > 0) {
    await payload.delete({
      collection: 'artikel',
      id: existingArticle.docs[0].id,
      req,
    })
  }
}

