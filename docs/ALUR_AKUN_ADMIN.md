# Alur masuk Google dan akses admin

> **Keadaan terbaru:** admin hanya memiliki halaman Kelola Pengguna di
> `/admin/users`. Dashboard admin dihapus. `/admin` dan `/admin/dashboard`
> mengarah ke halaman yang sama, tanpa berpindah ke area pengguna.
> Catatan dashboard di bawah adalah riwayat tahap sebelumnya.

> **Navigasi admin terkini:** `/admin` membuka `/admin/dashboard`. Dashboard ini
> khusus administrasi akun; `/dashboard` tetap halaman milik pengguna.
> Menu dan logo dalam area admin tidak menuju dashboard pengguna.
> `/admin/users` membuka pengelolaan akun, dan tautan kembali menuju dashboard
> admin. Keduanya tetap dapat ditinjau langsung dengan data lokal tanpa backend.

> **Akses pratinjau saat ini:** buka `/admin/users` secara langsung, tanpa login.
> `/admin` juga menuju halaman yang sama. Data dan perubahan masih lokal.
> Login tetap seperti versi awal yang diminta pengguna; Google belum terhubung.
> Pembatas rute admin dilepas untuk peninjauan tampilan dan perlu dipasang lagi
> bersama verifikasi peran server ketika integrasi autentikasi dikerjakan.

> **Catatan terbaru:** pengguna meminta tampilan dan perilaku login semula
> dikembalikan persis. Pemulihan sudah dilakukan, termasuk formulir email/password
> dan akses dashboard lama. Penjelasan Google-only berikut merupakan rancangan
> tahap sebelumnya; Google Auth tetap belum terhubung.

Mengikuti perubahan kebutuhan pengguna pada 16 November 2026, frontend hanya
menyediakan **Lanjutkan dengan Google**. Tidak ada formulir daftar akun,
login email/password, atau password contoh. `/register` mengarah ke `/login`.

## Alur yang dituju setelah integrasi

1. Pengunjung membuka `/login` dan memilih **Lanjutkan dengan Google**.
2. Pengunjung memilih akun Google dan memberikan persetujuan.
3. Backend memverifikasi identitas Google, lalu mencari akun terkait. Untuk
   pengguna baru, backend harus membuat profil USER tanpa formulir registrasi manual.
4. Backend memeriksa status aktif dan mengembalikan sesi serta peran yang sah.
5. USER diarahkan ke dashboard materi. ADMIN diarahkan ke `/admin/users`.
6. Keluar mengakhiri sesi. Akun diblokir tidak boleh memperoleh akses.

Peran ADMIN tidak boleh ditentukan sendiri dari email yang diketik atau pilihan
di browser. Admin pertama perlu ditetapkan di backend; admin berikutnya dapat
dipromosikan dari akun USER yang sudah dikenal sistem. Admin tidak membuatkan
alamat email atau kata sandi Google pengguna.

## Keadaan implementasi saat ini

- Ini masih pekerjaan frontend, **Google Auth belum dihubungkan**.
- Tombol Google menampilkan informasi integrasi belum tersedia; tidak membuka
  pemilihan akun Google atau membuat sesi palsu.
- Tidak ada SDK Google, request auth/admin, token, atau penyimpanan password baru.
- Pengunjung yang membuka dashboard, materi, Studio, atau admin diminta masuk.
  Karena Google belum terhubung, halaman tersebut belum bisa dicapai dari login.
- Tampilan pengelolaan pengguna tetap tersedia di source untuk dipakai setelah
  callback Google dan profil server diintegrasikan. Fixture bukan akun server.
- Pembatasan frontend belum menggantikan otorisasi server.

## Isi panel admin

Daftar pengguna, pencarian, filter peran/status, paginasi, detail dan riwayat materi,
ubah peran, blokir/buka blokir, serta hapus dengan konfirmasi. Admin tidak boleh
menghapus, memblokir atau mencopot peran admin akunnya sendiri.

## Hubungan dengan dokumen integrasi

Catatan perubahan kebutuhan sudah ditambahkan di awal
`Backend-H5P-Generator/docs/INTEGRASI_BACKEND_FRONTEND.md`. Daftar endpoint
register/login email di matriks mencatat kemampuan backend yang lama, bukan
pilihan masuk pada UI saat ini. Google OAuth masih memerlukan Client ID dan
verifikasi backend. Pembuatan profil saat login Google pertama belum diimplementasikan.

Modul upload/konversi, Studio dan penyimpanan proyek, ekspor/player dan skor siswa
tetap mengikuti status integrasi masing-masing. Pekerjaan ini tidak mengubahnya;
fitur yang sebelumnya memakai backend masih dapat memakai backend setelah akses
aplikasi tersedia. Riwayat proyek admin belum dihubungkan dengan data asli.
