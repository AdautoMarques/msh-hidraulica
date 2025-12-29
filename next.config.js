/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // ✅ Permite importar/usar arquivos .afm (font metrics do PDFKit)
    config.module.rules.push({
      test: /\.afm$/,
      type: "asset/source",
    });

    return config;
  },
};

module.exports = nextConfig;
