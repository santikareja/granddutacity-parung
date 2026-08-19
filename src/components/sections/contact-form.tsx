'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    needs: 'Pricelist Terbaru',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Format message
    const message = `Halo Marketing Grand Duta City Parung,\n\nSaya *${formData.name}*.\nSaya tertarik untuk mendapatkan informasi mengenai *${formData.needs}*.\n\nNomor WhatsApp saya: ${formData.phone}.\nMohon informasi lebih lanjut. Terima kasih.`;
    
    // WhatsApp URL
    const whatsappUrl = `https://wa.me/628131742034?text=${encodeURIComponent(message)}`;

    // Simulate small delay for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      window.open(whatsappUrl, '_blank');
    }, 800);
  };

  return (
    <div className="bg-[#F5F1E8]/5 border border-[#F5F1E8]/10 p-8 md:p-10 rounded-3xl backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A524]/5 blur-3xl -mr-16 -mt-16 rounded-full" />
      
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label htmlFor="name" className="text-xs uppercase tracking-widest text-[#F5F1E8]/50 font-medium ml-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              required
              placeholder="Masukkan nama Anda"
              className="w-full bg-[#F5F1E8]/5 border border-[#F5F1E8]/10 rounded-xl px-5 py-4 text-[#F5F1E8] placeholder:text-[#F5F1E8]/20 focus:outline-none focus:border-[#F5A524]/50 focus:ring-1 focus:ring-[#F5A524]/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-xs uppercase tracking-widest text-[#F5F1E8]/50 font-medium ml-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              id="phone"
              required
              placeholder="Contoh: 08123456789"
              className="w-full bg-[#F5F1E8]/5 border border-[#F5F1E8]/10 rounded-xl px-5 py-4 text-[#F5F1E8] placeholder:text-[#F5F1E8]/20 focus:outline-none focus:border-[#F5A524]/50 focus:ring-1 focus:ring-[#F5A524]/50 transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="needs" className="text-xs uppercase tracking-widest text-[#F5F1E8]/50 font-medium ml-1">
              Pilih Kebutuhan
            </label>
            <select
              id="needs"
              className="w-full bg-[#F5F1E8]/5 border border-[#F5F1E8]/10 rounded-xl px-5 py-4 text-[#F5F1E8] placeholder:text-[#F5F1E8]/20 focus:outline-none focus:border-[#F5A524]/50 focus:ring-1 focus:ring-[#F5A524]/50 transition-all appearance-none cursor-pointer"
              value={formData.needs}
              onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
            >
              <option className="bg-[#0b120c]" value="Pricelist Terbaru">Pricelist Terbaru</option>
              <option className="bg-[#0b120c]" value="Minta Brosur Digital">Minta Brosur Digital</option>
              <option className="bg-[#0b120c]" value="Informasi Cluster Ladera">Informasi Cluster Ladera</option>
              <option className="bg-[#0b120c]" value="Informasi Cluster Cascada">Informasi Cluster Cascada</option>
              <option className="bg-[#0b120c]" value="Jadwalkan Survey Lokasi">Jadwalkan Survey Lokasi</option>
              <option className="bg-[#0b120c]" value="Info Promo KPR & Cara Beli">Info Promo KPR & Cara Beli</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#F5A524] hover:bg-[#F5F1E8] text-[#0b120c] font-bold py-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs mt-4 group"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-[#0b120c]/30 border-t-[#0b120c] rounded-full animate-spin" />
            ) : (
              <>
                Kirim via WhatsApp
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>
          
          <p className="text-[10px] text-[#F5F1E8]/30 text-center italic">
            *Data Anda akan langsung diarahkan ke tim marketing kami di WhatsApp.
          </p>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#F5A524]" />
          </div>
          <h3 className="text-2xl font-serif text-[#F5F1E8] mb-2">Terima Kasih!</h3>
          <p className="text-[#F5F1E8]/60 mb-8 max-w-[280px]">
            Permintaan Anda sedang diproses. Jika jendela WhatsApp tidak terbuka otomatis, silakan klik tombol di bawah.
          </p>
          <a
            href={`https://wa.me/628131742034?text=${encodeURIComponent(`Halo Marketing Grand Duta City Parung, saya *${formData.name}*. Saya ingin info *${formData.needs}*.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/20 text-[#F5F1E8] px-8 py-4 rounded-xl transition-all text-xs uppercase tracking-widest font-bold border border-[#F5F1E8]/10"
          >
            Buka WhatsApp Manual
          </a>
          <button 
            onClick={() => setIsSuccess(false)}
            className="mt-6 text-[#F5F1E8]/40 hover:text-[#F5F1E8] text-[10px] uppercase tracking-widest"
          >
            Isi Form Lagi
          </button>
        </div>
      )}
    </div>
  );
}
