/* eslint-disable @typescript-eslint/no-require-imports -- loader CommonJS untuk Payload CLI; wajib pakai require() karena bergantung pada __dirname dan module.exports gaya CJS (bukan ESM) */
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const srcBaseUrl = `${pathToFileURL(path.resolve(__dirname, "src")).toString()}/`;

module.exports = (async () => {
  const { tsImport } = await import("tsx/esm/api");
  const [
    { buildConfig },
    { postgresAdapter },
    { lexicalEditor },
    { seoPlugin },
    { cloudinaryStorage },
    artikelModule,
    categoriesModule,
    mediaModule,
    tagsModule,
    usersModule,
  ] = await Promise.all([
    import("payload"),
    import("@payloadcms/db-postgres"),
    import("@payloadcms/richtext-lexical"),
    import("@payloadcms/plugin-seo"),
    import("payload-storage-cloudinary"),
    tsImport("./collections/Artikel.ts", srcBaseUrl),
    tsImport("./collections/Categories.ts", srcBaseUrl),
    tsImport("./collections/Media.ts", srcBaseUrl),
    tsImport("./collections/Tags.ts", srcBaseUrl),
    tsImport("./collections/Users.ts", srcBaseUrl),
  ]);

  const { Artikel } = artikelModule.default;
  const { Categories } = categoriesModule.default;
  const { Media } = mediaModule.default;
  const { Tags } = tagsModule.default;
  const { Users } = usersModule.default;
  const databaseUrl = process.env.DATABASE_URI || "";
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
  const shouldUseSSL = Boolean(databaseUrl) && !/(localhost|127\.0\.0\.1)/i.test(databaseUrl);

  return buildConfig({
    admin: {
      user: Users.slug,
      importMap: { baseDir: path.resolve(__dirname, "src") },
      components: {
        graphics: {
          Logo: "@/payload/admin/components/AdminAuthLogo",
        },
        views: {
          createFirstUser: {
            Component: "@/payload/admin/views/CreateFirstUserView",
          },
          dashboard: {
            Component: "@/payload/admin/views/DashboardView",
          },
          login: {
            Component: "@/payload/admin/views/LoginView",
          },
        },
      },
    },
    collections: [Artikel, Categories, Media, Tags, Users],
    editor: lexicalEditor(),
    db: postgresAdapter({
      pool: {
        connectionString: databaseUrl,
        ...(shouldUseSSL ? { ssl: { rejectUnauthorized: false } } : {}),
      },
    }),
    secret: process.env.PAYLOAD_SECRET || "",
    typescript: {
      outputFile: path.resolve(__dirname, "src/payload-types.ts"),
    },
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "",
    cors: [
      "https://granddutacitysouthofjakarta.com",
      "http://localhost:3000",
    ],
    csrf: [
      "https://granddutacitysouthofjakarta.com",
      "http://localhost:3000",
    ],
    plugins: [
      ...(hasCloudinaryConfig
        ? [
            cloudinaryStorage({
              cloudConfig: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
                api_key: process.env.CLOUDINARY_API_KEY || "",
                api_secret: process.env.CLOUDINARY_API_SECRET || "",
              },
              collections: {
                media: {
                  folder: "grand-duta-city",
                },
              },
            }),
          ]
        : []),
      seoPlugin({
        uploadsCollection: "media",
        generateTitle: ({ doc }) => `${doc.title} | Grand Duta City`,
        generateDescription: ({ doc }) => doc.excerpt || "",
        generateURL: ({ doc }) => `https://granddutacitysouthofjakarta.com/${doc.slug}`,
      }),
    ],
  });
})();
