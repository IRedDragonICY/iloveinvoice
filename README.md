# 💜 ILoveInvoice

**Generator Invoice Online Gratis dengan Fitur Lengkap**

ILoveInvoice adalah aplikasi web modern untuk membuat, mengelola, dan mengekspor invoice dengan mudah. Dibangun menggunakan Next.js 15 dengan React 19 dan TypeScript untuk pengalaman pengguna yang optimal.

## ✨ Fitur Utama

### 📄 Manajemen Invoice
- **Editor Invoice Interaktif** - Buat dan edit invoice dengan tampilan real-time
- **Preview Invoice** - Lihat hasil invoice sebelum diekspor
- **Export ke PDF** - Unduh invoice dalam format PDF berkualitas tinggi
- **Print Invoice** - Cetak invoice langsung dari browser
- **Riwayat Invoice** - Simpan dan kelola semua invoice yang pernah dibuat

### 🏢 Manajemen Perusahaan
- **Profil Perusahaan** - Atur informasi perusahaan (nama, alamat, telepon, email)
- **Logo Perusahaan** - Upload dan tampilkan logo perusahaan di invoice
- **Pengaturan Kontak** - Kontrol tampilan informasi kontak perusahaan

### 🛍️ Manajemen Produk
- **Database Produk** - Simpan dan kelola produk/layanan
- **Editor Produk** - Tambah, edit, dan hapus produk dengan mudah
- **Quick Add** - Tambahkan produk langsung ke invoice

### 💰 Sistem Perhitungan
- **Multi Mata Uang** - Dukungan IDR, USD, EUR, SGD, JPY
- **Sistem Diskon Fleksibel** - Diskon per item atau diskon invoice keseluruhan
- **Perhitungan Pajak** - Sistem pajak otomatis dengan persentase yang dapat disesuaikan
- **Kalkulasi Otomatis** - Subtotal, diskon, pajak, dan total dihitung otomatis

### 🎨 Kustomisasi
- **Theme Mode** - Light, Dark, atau System theme
- **Accent Colors** - Pilihan warna aksen (Indigo, Emerald, Sky, Amber, Rose, Violet, Neutral)
- **Responsive Design** - Tampilan optimal di desktop dan mobile

### 📱 Navigasi Modern
- **Desktop Sidebar** - Navigasi sidebar untuk desktop
- **Mobile Bottom Navigation** - Bottom nav yang user-friendly untuk mobile
- **Mobile Header** - Header responsif untuk perangkat mobile

## 🚀 Teknologi

- **Framework**: Next.js 15 dengan App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animasi**: Framer Motion
- **PDF Export**: jsPDF + html2canvas-pro
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

## 📦 Instalasi

### Prasyarat
- Node.js 18+ 
- npm, yarn, pnpm, atau bun

### Setup Proyek

1. **Clone repository**
```bash
git clone <repository-url>
cd iloveinvoice
```

2. **Install dependencies**
```bash
npm install
# atau
yarn install
# atau
pnpm install
# atau
bun install
```

3. **Jalankan development server**
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

4. **Buka aplikasi**
Kunjungi [http://localhost:3000](http://localhost:3000) di browser

## 🔧 Scripts

- `npm run dev` - Menjalankan development server dengan Turbopack
- `npm run build` - Build aplikasi untuk production
- `npm run start` - Menjalankan production server
- `npm run lint` - Menjalankan ESLint untuk code quality

## 📁 Struktur Proyek

```
src/
├── app/                    # App Router pages
│   ├── invoice/           # Invoice editor & detail
│   ├── company/           # Company management
│   ├── products/          # Product management
│   ├── history/           # Invoice history
│   ├── settings/          # App settings
│   └── dashboard/         # Dashboard (future)
├── components/            # React components
│   ├── invoice/           # Invoice-specific components
│   ├── layout/            # Layout components
│   ├── navigation/        # Navigation components
│   ├── product/           # Product components
│   ├── shared/            # Shared/common components
│   └── ui/                # UI components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & types
└── services/              # External services
```

## 🎯 Cara Penggunaan

### 1. Setup Perusahaan
- Masuk ke halaman **Company** 
- Isi informasi perusahaan (nama, alamat, kontak)
- Upload logo perusahaan (opsional)

### 2. Kelola Produk
- Buka halaman **Products**
- Tambahkan produk/layanan dengan nama, deskripsi, dan harga
- Produk akan tersedia untuk dipilih saat membuat invoice

### 3. Buat Invoice
- Klik **New Invoice** atau edit invoice yang ada
- Isi informasi customer
- Tambahkan item invoice (dari produk atau manual)
- Atur diskon dan catatan jika diperlukan
- Preview dan export ke PDF

### 4. Kelola Riwayat
- Lihat semua invoice di halaman **History**
- Klik invoice untuk melihat detail atau mengedit
- Export ulang invoice yang sudah dibuat

### 5. Pengaturan
- Sesuaikan tema (light/dark)
- Pilih warna aksen
- Atur mata uang dan pengaturan pajak
- Kontrol informasi yang ditampilkan di invoice

## 🌟 Fitur Unggulan

### 💾 Persistent Storage
Semua data disimpan di local storage browser, sehingga data tidak hilang saat reload halaman.

### 🎨 Theming System
Sistem tema yang komprehensif dengan dukungan light/dark mode dan multiple accent colors.

### 📱 Mobile-First Design
Interface yang responsif dan user-friendly di semua perangkat.

### ⚡ Performance
Dibangun dengan Next.js 15 dan Turbopack untuk performance optimal.

### 🔄 Real-time Preview
Perubahan pada invoice langsung terlihat di preview panel.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat issue atau pull request untuk perbaikan dan fitur baru.

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lengkap.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

**Made with 💜 for invoice management**
