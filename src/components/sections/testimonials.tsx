import { Star } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      id: 1,
      name: "Budi Santoso",
      role: "Penghuni Cluster Cascada",
      content:
        "Tinggal di Grand Duta City Parung adalah keputusan terbaik. Udaranya benar-benar lebih sejuk dibanding Jakarta, dan fasilitas taman 80 hektarnya membuat anak-anak leluasa bermain di sore hari. Akses ke pintu tol juga sangat memudahkan saya bekerja ke TB Simatupang.",
      rating: 5,
    },
    {
      id: 2,
      name: "Siti Aminah",
      role: "Pembeli Tipe Verona (Ladera)",
      content:
        "Proses KPR sangat dibantu oleh tim marketing. Saya tertarik dengan desain American Classic di Ladera, plafon tingginya membuat sirkulasi udara di dalam rumah sangat bagus. Tidak sabar menunggu serah terima!",
      rating: 5,
    },
    {
      id: 3,
      name: "Hendrik Wijaya",
      role: "Investor / Pemilik Ruko SOJ",
      content:
        "Kawasan yang sangat potensial untuk bisnis. Dengan konsep kota mandiri seluas 200 hektar, captive market-nya sangat jelas. Progress pembangunannya juga cepat dan rapi. Duta Putra Land terbukti komitmennya.",
      rating: 5,
    },
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-24 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Apa Kata Mereka?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pengalaman nyata dari para penghuni dan pembeli yang telah mempercayakan hunian impian mereka di Grand Duta City Parung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-gray-700 leading-relaxed mb-6">
                "{review.content}"
              </blockquote>
              <div className="mt-auto flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-lg">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-sm text-gray-500">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
