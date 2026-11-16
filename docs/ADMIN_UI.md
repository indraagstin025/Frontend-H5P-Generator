# Catatan UI akun dan admin

> **Kolom terbaru:** Materi dan sel jumlah materi dihapus dari tabel pengguna,
> termasuk label seluler. Kolom yang tersisa: Pengguna, Peran, Status, Bergabung,
> Tindakan. Delivery Gate PASS: source header/sel sesuai, build berhasil, navigasi,
> tindakan dan layout desktop/seluler lulus pengujian browser yang sama.

> **Header terbaru:** baris Administrasi / Pengguna dan CSS-nya dihapus, termasuk
> ruang header. Main langsung menjadi konten pertama pada area admin.
> Delivery Gate PASS: header/ruang kosong tidak ada (diperiksa di browser), fungsi
> admin dan Logout tetap berjalan, layout 320/390/1440 px tanpa overflow, build
> berhasil dan tidak ada exception. Total 36 pemeriksaan PASS pada rekaman rute admin.

> **Perubahan terbaru:** banner pratinjau di atas ringkasan dan seluruh aksi Ubah
> peran dihapus, termasuk state, handler dan dialog peran. Peran tetap dapat
> dilihat/disaring, tetapi tidak dapat diedit. Tindakan baris hanya Blokir/Buka
> blokir dan Hapus. Label data contoh yang lain tetap ada; backend belum terhubung.
> Delivery Gate: fungsi PASS (konfirmasi blokir/hapus, perubahan status, profil
> dan Logout); responsif PASS (320/390/1440 px); konsistensi PASS (layout dan
> komponen dipertahankan); runtime/build PASS. 35 pemeriksaan browser PASS,
> rekaman `C:/H5P/out/admin-route-checks.txt`.

> **Paginasi terbaru:** pilihan Baris per halaman dihapus. Daftar memakai ukuran
> tetap lima pengguna, ringkasan di kiri, nomor halaman dan dua panah di kanan,
> mengikuti pola paginasi halaman user. Panah pertama/terakhir dinonaktifkan
> sesuai batas halaman dan memiliki label aksesibel.
> Delivery Gate: fungsi PASS (enam akun fixture browser menghasilkan lima baris
> halaman 1 dan satu baris halaman 2, maju/mundur dan batas tombol diuji),
> responsif PASS (320/390/1440 px), konsistensi/purpose PASS (pola user dan lima
> baris tetap sesuai instruksi), runtime/build PASS. Sepuluh pemeriksaan PASS
> pada `C:/H5P/out/admin-pagination-checks.txt`. Akun uji tambahan hanya disuntikkan
> pada respons browser selama pengujian, tidak ditambahkan ke source/fixture aplikasi.

> **Pembersihan terbaru sesuai gambar pengguna:** pengatur pratinjau kondisi
> (beserta state simulasinya), catatan pembatasan akun, footer, dan ringkasan
> Total materi dihapus. Ringkasan kini tiga kolom akun pada desktop dan tersusun
> vertikal pada seluler. Proteksi akun sendiri tetap ada pada tindakan; yang
> dihapus adalah teks penjelasnya. Kondisi pencarian kosong tetap tersedia.
> Delivery Gate: fungsi PASS (peran/blokir/konfirmasi hapus/profil/Logout),
> responsif PASS (320/390/1440 px), konsistensi PASS (ringkasan tiga metrik tanpa
> ruang kolom kosong), kejujuran data PASS (penanda contoh tetap ada), build/runtime
> PASS. Total 34 pemeriksaan browser PASS di `C:/H5P/out/admin-route-checks.txt`.

> **Penyederhanaan terbaru:** blok sidebar "Administrasi H5P" dan fitur Detail
> pengguna dihapus, termasuk dialog dan CSS yang tidak dipakai. Setiap baris hanya
> memiliki Ubah peran, Blokir/Buka blokir, dan Hapus. Catatan Detail di bawah
> merupakan riwayat implementasi sebelumnya.
> Delivery Gate: fungsi PASS (dialog peran, blokir, konfirmasi hapus, profil dan
> Logout diuji); responsif PASS (320/390/1440 px); konsistensi PASS (komponen dan
> palet lama dipertahankan); build/runtime PASS (build berhasil, tanpa exception).
> Total 32 pemeriksaan browser PASS di `C:/H5P/out/admin-route-checks.txt`.
> Lint berhasil dengan empat peringatan lama di luar perubahan admin.

> **Logout terbaru:** menu "Keluar dari admin" di navigasi dihapus. Klik profil
> administrator membuka popup "Akun Anda" dengan tombol Logout, mengikuti pola,
> label dan tampilan profil user. Logout membersihkan sesi lokal dan kembali ke
> `/`, sama dengan perilaku HomePage. Profil tersedia pada desktop dan seluler.
> Popup ditutup lewat tombol profil, Escape, klik luar atau fokus keluar.
> Delivery Gate: fungsi/keyboard PASS (popup, Escape dan fokus, klik luar,
> toggle dan Logout diuji); responsif PASS (320/390/1440 px, popup muat tanpa
> overflow); konsistensi/purpose PASS (pola profil user, bayangan hanya untuk
> lapisan popup); runtime/build PASS (tidak ada exception, build berhasil).
> Total 29 pemeriksaan browser PASS pada `C:/H5P/out/admin-route-checks.txt`.
> Lint berhasil dengan empat peringatan lama di luar kode admin.

> **Keputusan terbaru: admin hanya satu halaman.** Dashboard admin, komponennya,
> menu, tautan kembali, dan CSS khusus dashboard dihapus. `/admin` dan alamat lama
> `/admin/dashboard` dialihkan ke `/admin/users`. Logo dan menu hanya menuju
> Kelola Pengguna; tidak ada tautan ke dashboard pengguna. Login tidak diubah.
> Catatan dashboard di bagian historis bawah sudah tidak berlaku.
>
> Delivery Gate perubahan: navigasi PASS (alamat utama/lama, logo, menu dan keluar
> diuji), fungsi PASS (dialog detail buka/tutup), responsif PASS (320/390/1440 px),
> konsistensi visual PASS (layout Kelola Pengguna dipertahankan), runtime/build PASS
> (build berhasil dan tidak ada exception). Total 17 pemeriksaan browser PASS,
> rekaman `C:/H5P/out/admin-route-checks.txt`.

> **Pemisahan area admin terbaru:** `/admin` sekarang mengarah ke
> `/admin/dashboard`, bukan daftar pengguna. Dashboard admin dan
> `/admin/users` memakai AdminLayout yang sama. Logo, menu Dashboard, tautan
> kembali, ringkasan akun dan pengelolaan akses tetap menuju `/admin/...`.
> Tidak ada tautan menuju dashboard/materi/Studio pengguna di layout admin.
> Hanya tindakan eksplisit **Keluar dari admin** menuju login.
>
> Dashboard menampilkan jumlah akun/aktif/diblokir/admin dan akun terbaru dari
> fixture lokal. Perubahan Kelola Pengguna langsung tercermin pada ringkasan.
> Tombol Tinjau akun diblokir membuka daftar pengguna dengan filter BLOCKED.
> Ini perluasan UI sesuai permintaan pengguna; bukan API admin/statistik baru.
> Backend tetap belum dihubungkan dan halaman login asli tidak diubah.
>
> Verifikasi: build PASS; lint PASS tanpa temuan baru (empat peringatan lama).
> 24 pemeriksaan Chrome PASS: akses langsung, menu aktif, semua tautan dashboard,
> perubahan ringkasan sesudah blokir, filter dari dashboard, refresh, keluar,
> dialog dan breakpoint. Rekaman `C:/H5P/out/admin-route-checks.txt`.
> Delivery Gate: navigasi/fungsi PASS (seluruh tautan baru diuji), responsif PASS
> (dashboard pada lima lebar 320–1440 px), identitas/purpose PASS (memakai palet,
> font dan komponen admin yang sama; ringkasan untuk pengawasan akun), kejujuran
> data PASS (label data contoh lokal), aksesibilitas PASS (landmark bersama,
> h1 per halaman, NavLink aria-current, fokus dan tautan native), runtime PASS
> (tidak ada exception browser). Dial tetap ENERGY 1 / RHYTHM 2 / MOTION 1.

> **Perbaikan akses pratinjau terbaru:** `/admin/users` sekarang dapat dibuka
> langsung tanpa sesi; `/admin` mengarah ke halaman tersebut. Ini hanya pratinjau
> frontend dengan data lokal, bukan akses admin server. Login asli tetap dipertahankan.
> Build PASS. Sebelas pemeriksaan browser PASS, termasuk URL langsung, refresh,
> shortcut, identitas pratinjau, perlindungan akun contoh, dialog detail,
> navigasi kembali dan layout 320/390/1440 px. Tidak ada runtime exception.
> Rekaman: `C:/H5P/out/admin-route-checks.txt`.
> Delivery Gate perubahan akses: fungsi/navigasi PASS (URL tidak lagi mengarah ke
> login), responsif PASS (tiga ukuran), kejujuran data PASS (label tanpa login/data lokal),
> visual PASS (komponen dan identitas lama dipertahankan). Catatan penjagaan rute
> di bagian historis bawah tidak berlaku untuk pratinjau admin saat ini.

> **Pemulihan terbaru:** atas permintaan pengguna, `LoginPage.tsx` dan
> `LoginPage.css` dikembalikan persis ke versi awal sebelum perubahan pada sesi ini.
> Form email/password, tombol Google nonaktif, ornamen dan transisi lama kembali.
> Akses dashboard/materi/Studio juga kembali seperti semula. Catatan Google-only
> di bawah adalah catatan tahap sebelumnya, bukan keadaan login yang sekarang.
>
> Verifikasi pemulihan: kedua file identik dengan HEAD awal (`git diff --exit-code`),
> build berhasil, 14 pemeriksaan Chrome lulus. Rekaman:
> `C:/H5P/out/restored-login-checks.txt`. PASS pemulihan: source identik; PASS
> interaksi: tampil/sembunyi password, validasi email, tutup pesan, masuk dashboard,
> kembali dan logo; PASS responsif: lima lebar 320–1440 px tanpa overflow;
> PASS runtime: tidak ada exception. Pemulihan mempertahankan desain lama sesuai
> instruksi eksplisit pengguna, bukan audit ulang desain asli.

## Keadaan terkini

Login hanya melalui tampilan Google. Formulir email/password, pendaftaran,
password fixture, serta fungsi register/login lokal dihapus. `/register`
mengarah ke `/login`. Tombol Google memberi umpan balik bahwa integrasi belum
tersedia, tanpa membuat sesi atau memanggil backend.

Panel admin tetap dijaga oleh ProtectedRoute. Tanpa integrasi Google, akses dari
login ke halaman internal memang belum tersedia. Panduan: [ALUR_AKUN_ADMIN.md](./ALUR_AKUN_ADMIN.md).

Design Read: halaman masuk dan pengelolaan pengguna H5P Generator, mengikuti
logo, font dan warna frontend yang ada. ENERGY 1 / RHYTHM 2 / MOTION 1.
Hijau mempertahankan identitas produk; putih membedakan area masuk. Bayangan
panel memisahkannya dari latar hijau. Ikon Google menandai penyedia identitas;
ikon admin yang ada menyatakan tindakan pengguna, pencarian dan materi.

## Verifikasi dan Delivery Gate

Pengujian 67 kasus login/password/register pada versi sebelumnya tidak berlaku
untuk login Google. Rekaman yang berlaku sekarang:
`C:/H5P/out/google-ui-checks.txt`, dibuat oleh `C:/H5P/out/check-google-ui.mjs`.
Build dan lint diperiksa setelah perubahan. Empat peringatan lint berada pada
file lama UploadDock, Topbar, StudioContext, dan StudioView; build memperingatkan
ukuran bundle melebihi 500 kB.

- R-02 PASS: tidak ada em dash dalam teks baru.
- R-03 PASS: login diperiksa pada lebar 320, 390, 768, 1024 dan 1440 px; kontrol setinggi minimal 44 px.
- R-17 PASS: login tidak menampilkan statistik; angka panel admin berlabel data lokal/contoh.
- R-18 PASS: tidak ada testimonial atau foto identitas buatan.
- R-23 PASS: menggunakan logo proyek dan ikon penyedia Google; tidak membuat aset baru.
- R-24 PASS: tautan kembali/brand menuju beranda nyata; `/register` diarahkan ke login.
- R-25 PASS: mempertahankan warna teks panel login sebelumnya, netral gelap di atas putih; kontras teks admin tercatat 5,49:1 hingga 12,20:1.
- R-26 PASS: tombol Google menampilkan status belum terhubung; tautan brand dan kembali membuka beranda. Tidak ada tombol daftar/password tersisa.
- R-27 PASS: belum ada pengambilan data Google; status integrasi dinyatakan terlihat. Panel admin mempertahankan tampilan loading/kosong/error.
- R-28 PASS: tidak ada FAQ yang ditambahkan.
- R-32 PASS: tombol/link native, focus-visible, aktivasi Google dengan keyboard diperiksa; dialog admin tetap native.
- R-33 PASS: source diedit langsung dengan patch, tanpa script pengubah CSS/source.
- R-34 PASS: hanya tema terang sesuai frontend; tidak ada toggle tema baru.
- R-35 PASS: build dan pemeriksaan browser dicatat pada rekaman terbaru; tidak mengklaim Google OAuth sudah berfungsi.
- R-36 PASS: tidak ada klaim keamanan/performa atau keberhasilan OAuth palsu.
- R-37 PASS: mengikuti identitas frontend yang ada dan instruksi Google-only pengguna.
- R-38 PASS: status belum terhubung terlihat; tidak ada simulasi identitas Google yang disamarkan sebagai login sebenarnya.
- R-39 PASS: satu h1, judul halaman, landmark, alt dan dimensi logo, nama tombol, pointer serta focus/hover/active tersedia.
- R-40 PASS: dimensi logo dan SVG ditentukan; tidak ada SDK atau script Google yang ditambahkan.
- R-01 PASS: gradient mengikuti latar merek yang sudah ada, membedakan panel putih.
- R-04 PASS: ikon Google menyatakan penyedia login; ikon admin memiliki arti operasional.
- R-06 PASS: font mengikuti identitas frontend, bukan monospace dekoratif.
- R-07 PASS: tidak ada pola grid/dot baru.
- R-08 PASS: panah kembali menunjukkan arah navigasi.
- R-09 PASS: tidak menambahkan badge marketing; penanda merek yang sudah ada dipertahankan.
- R-10 PASS: tidak menambahkan glassmorphism.
- R-12 PASS: bayangan hanya memisahkan panel masuk dan dialog dari latarnya.
- R-13 PASS: tidak menambahkan glow.
- R-14 PASS: tidak menambahkan kartu fitur; panel masuk berfokus pada satu tindakan.
- R-19 PASS: konten masuk ditampilkan tanpa animasi masuk baru.
- R-22 PASS: tidak ada ilustrasi generik baru.
- Liveliness PASS: dial eksplisit, tombol Google menjadi fokus, warna dan logo mengikuti H5P Generator, jarak memisahkan penjelasan dan tindakan.
- C-1 PASS: tujuan palet, panel dan ikon tercatat di atas.
- C-2 PASS: aksi yang tersedia memiliki respons yang terlihat atau tujuan navigasi nyata.
- C-3 PASS: konten masuk hanya menjelaskan penyedia identitas dan status implementasi.
- C-4 PASS: login diperiksa pada lima breakpoint; rute internal tetap meminta sesi.
- C-5 PASS: tidak ada klaim atau akun nyata yang difabrikasi.
- R-05 PASS: halaman masuk berfokus satu tindakan, bukan template landing baru.
- R-11 PASS: tombol memakai sudut lunak, tanpa menjadikan seluruh kontrol pill.
- R-15 PASS: label tindakan spesifik, Lanjutkan dengan Google dan Kembali ke beranda.
- R-16 PASS: tidak ada jargon pemasaran AI.
- R-20 PASS: identitas dan istilah H5P Generator dipertahankan.
- R-21 PASS: tema terang mengikuti frontend, bukan dark mode paksa.
- R-29 PASS: palet utama hijau/putih/netral; warna logo Google menyatakan identitas penyedia.
- R-30 PASS: menggunakan tata letak proyek, bukan menyalin produk lain.
- R-31 PASS: alasan keputusan visual utama tercatat di atas.
