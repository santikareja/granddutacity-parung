'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { ChevronDown, ArrowUpRight, MessageCircle } from 'lucide-react';

type NavItem = {
	label: string;
	href?: string;
	submenu?: { label: string; href: string; desc?: string }[];
};

export function Header() {
	const [open, setOpen] = React.useState(false);
	const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
	const scrolled = useScroll(15);

	const links: NavItem[] = [
		{ label: 'Beranda', href: '/' },
		{ 
			label: 'Cluster', 
			href: '#',
			submenu: [
				{ label: 'Cluster Ladera', href: '/cluster-ladera', desc: 'American Classic Modern · Mulai 800 Jt' },
				{ label: 'Cluster Cascada', href: '/cluster-cascada', desc: 'Modern Tropical Resort · Mulai 800 Jt' }
			]
		},
		{ 
			label: 'Harga & Stok', 
			href: '#',
			submenu: [
				{ label: 'Pricelist Lengkap', href: '/pricelist-grand-duta-city', desc: 'Harga & simulasi cicilan terbaru' },
				{ label: 'Update Stok & Siteplan', href: '/update-stok-siteplan-grand-duta-city-parung', desc: 'Ketersediaan unit real-time' }
			]
		},
		{ 
			label: 'Informasi', 
			href: '#',
			submenu: [
				{ label: 'Tentang Developer', href: '/about', desc: 'Duta Putra Land sejak 1983' },
				{ label: 'Lokasi & Akses', href: '/lokasi-akses-grand-duta-city-parung', desc: 'Akses 4 exit tol & TOD' },
				{ label: 'Cara Beli & KPR', href: '/cara-beli-kpr', desc: 'Promo Tanpa DP & 8 Bank Mitra' },
				{ label: 'Galeri Foto & Video', href: '/galeri', desc: 'Dokumentasi kawasan & fasilitas' },
				{ label: 'Blog Properti', href: '/artikel', desc: 'Tips investasi properti Bogor' }
			]
		},
		{ label: 'Kontak', href: '/kontak' },
	];

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'fixed left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
				scrolled
					? 'top-2 sm:top-4 px-4 sm:px-6'
					: 'top-0 px-0'
			)}
		>
			<div
				className={cn(
					'mx-auto transition-all duration-500',
					scrolled
						? 'max-w-6xl rounded-full border border-white/12 bg-[#090D0A]/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] px-4 sm:px-6 py-2'
						: 'max-w-none w-full border-b border-white/8 bg-transparent px-6 sm:px-10 md:px-16 py-3.5'
				)}
			>
				<nav className="flex items-center justify-between">
					{/* Brand Logo */}
					<Link
						href="/"
						className="group relative flex items-center w-[110px] sm:w-[135px] aspect-[16/5] transition-transform duration-300 hover:scale-[1.02]"
					>
						<Image
							src="/logo.svg"
							alt="Grand Duta City Parung"
							fill
							priority
							loading="eager"
							fetchPriority="high"
							sizes="(max-width: 768px) 110px, 135px"
							className="object-contain transition-opacity duration-300 group-hover:opacity-90"
						/>
					</Link>

					{/* Desktop Navigation Links */}
					<div className="hidden items-center gap-1 xl:gap-2 lg:flex">
						{links.map((link, i) => (
							<div key={i} className="relative group">
								{link.submenu ? (
									<button
										type="button"
										className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] tracking-[0.16em] text-[#F8F6F0]/75 hover:text-[#F8F6F0] hover:bg-white/5 rounded-full font-sans font-semibold uppercase transition-all duration-300 cursor-pointer"
									>
										<span>{link.label}</span>
										<ChevronDown className="w-3 h-3 text-[#D49A3D] opacity-80 group-hover:rotate-180 transition-transform duration-300" />
									</button>
								) : (
									<Link
										href={link.href!}
										className="px-3.5 py-2 text-[11px] tracking-[0.16em] text-[#F8F6F0]/75 hover:text-[#F8F6F0] hover:bg-white/5 rounded-full font-sans font-semibold uppercase transition-all duration-300 inline-block"
									>
										{link.label}
									</Link>
								)}

								{/* Desktop Submenu Dropdown (Double-Bezel) */}
								{link.submenu && (
									<div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-50">
										<div className="p-1.5 rounded-2xl bg-[#131B15]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-black/40">
											<div className="flex flex-col gap-0.5">
												{link.submenu.map((sub, j) => (
													<Link
														key={j}
														href={sub.href}
														className="group/sub flex flex-col px-4 py-2.5 rounded-xl hover:bg-white/8 transition-all duration-200"
													>
														<div className="flex items-center justify-between text-xs font-medium text-[#F8F6F0] group-hover/sub:text-[#F5A524] transition-colors">
															<span>{sub.label}</span>
															<ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:translate-y-0 transition-all duration-200 text-[#F5A524]" />
														</div>
														{sub.desc && (
															<span className="text-[10px] text-[#F8F6F0]/40 group-hover/sub:text-[#F8F6F0]/60 font-sans transition-colors mt-0.5">
																{sub.desc}
															</span>
														)}
													</Link>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>

					{/* Right CTA Button: Button-in-Button Architecture */}
					<div className="hidden lg:flex items-center">
						<a
							href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20Grand%20Duta%20City%20South%20of%20Jakarta.%20Boleh%20minta%20info%20promo%20terbaru%3F"
							target="_blank"
							rel="noopener noreferrer"
							className="group relative inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-[11px] tracking-[0.16em] font-sans font-bold uppercase shadow-[0_4px_20px_rgba(200,82,26,0.35)] hover:shadow-[0_6px_28px_rgba(200,82,26,0.5)] active:scale-[0.98] transition-all duration-300"
						>
							<span>Konsultasi</span>
							<span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-300 text-white">
								<ArrowUpRight className="w-3.5 h-3.5" />
							</span>
						</a>
					</div>

					{/* Mobile Menu Trigger Button */}
					<div className="flex lg:hidden items-center gap-2">
						<a
							href="https://wa.me/628131742034"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="WhatsApp Marketing"
							className="w-9 h-9 rounded-full bg-[#C8521A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
						>
							<MessageCircle className="w-4 h-4" />
						</a>
						<Button
							size="icon"
							variant="outline"
							onClick={() => setOpen(!open)}
							aria-label="Toggle Navigation"
							className="w-9 h-9 rounded-full border-white/20 text-[#F8F6F0] bg-white/5 hover:bg-white/10 active:scale-95"
						>
							<MenuToggleIcon open={open} className="size-4" duration={300} />
						</Button>
					</div>
				</nav>
			</div>

			{/* Fullscreen Mobile Drawer with Staggered Mask Reveals */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
						className="fixed inset-x-4 top-20 bottom-6 z-50 flex flex-col overflow-hidden rounded-3xl bg-[#090D0A]/96 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] lg:hidden p-6"
					>
						<div className="flex flex-col justify-between h-full overflow-y-auto pr-1">
							<div className="flex flex-col gap-2 pt-2">
								{links.map((link, idx) => (
									<motion.div
										key={link.label}
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.05 * idx, duration: 0.3 }}
										className="flex flex-col border-b border-white/5 pb-2"
									>
										{link.submenu ? (
											<>
												<button
													type="button"
													onClick={() => setOpenSubmenu(openSubmenu === link.label ? null : link.label)}
													className="flex items-center justify-between py-2 text-sm font-semibold tracking-[0.14em] uppercase text-[#F8F6F0]/90 hover:text-[#F5A524] transition-colors cursor-pointer"
												>
													<span>{link.label}</span>
													<ChevronDown
														className={cn(
															"w-4 h-4 text-[#D49A3D] transition-transform duration-300",
															openSubmenu === link.label && "rotate-180"
														)}
													/>
												</button>
												<AnimatePresence>
													{openSubmenu === link.label && (
														<motion.div
															initial={{ height: 0, opacity: 0 }}
															animate={{ height: "auto", opacity: 1 }}
															exit={{ height: 0, opacity: 0 }}
															transition={{ duration: 0.25 }}
															className="overflow-hidden flex flex-col gap-1.5 pl-3 pt-1 pb-2"
														>
															{link.submenu.map((sub) => (
																<Link
																	key={sub.label}
																	onClick={() => setOpen(false)}
																	href={sub.href}
																	className="py-1 text-xs text-[#F8F6F0]/70 hover:text-[#F5A524] transition-colors flex items-center justify-between"
																>
																	<span>{sub.label}</span>
																	<ArrowUpRight className="w-3 h-3 text-[#D49A3D]" />
																</Link>
															))}
														</motion.div>
													)}
												</AnimatePresence>
											</>
										) : (
											<Link
												onClick={() => setOpen(false)}
												href={link.href!}
												className="py-2 text-sm font-semibold tracking-[0.14em] uppercase text-[#F8F6F0]/90 hover:text-[#F5A524] transition-colors"
											>
												{link.label}
											</Link>
										)}
									</motion.div>
								))}
							</div>

							{/* Bottom Drawer CTA */}
							<div className="pt-6 mt-auto">
								<a
									href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20Promo%20Grand%20Duta%20City%20South%20of%20Jakarta."
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-full bg-[#C8521A] text-white font-sans font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#C8521A]/30 active:scale-98 transition-all"
								>
									<span>Konsultasi WhatsApp</span>
									<ArrowUpRight className="w-4 h-4" />
								</a>
								<p className="text-[10px] text-center text-[#F8F6F0]/40 tracking-wider uppercase mt-3">
									Kota Mandiri 200 Ha by Duta Putra Land
								</p>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
