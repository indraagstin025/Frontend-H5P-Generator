Folder ini berisi salinan library H5P untuk mode "Player H5P asli".

Sumber (tidak perlu LMS): backend/storage/h5p/libraries/
(paket seed dari H5P Hub, ~63 folder). Salin semuanya KECUALI
yang berawalan H5PEditor.* (itu alat editor, tidak dipakai player):

  Contoh isi yang benar:
    h5p-libraries/
      H5P.CoursePresentation-1.26/
        library.json
        ...
      H5P.MultiChoice-1.16/
      H5P.Blanks-1.14/
      H5P.TrueFalse-1.8/
      H5P.Audio-1.5/
      H5P.Image-1.1/
      H5P.AdvancedText-1.1/
      ... (beserta semua dependensinya)

Catatan versi: player pratinjau otomatis memakai versi
CoursePresentation tertinggi yang ada di sini (1.22–1.26).
Versi default untuk file ekspor (1.24, mengikuti LMS) diatur
terpisah di langkah Ekspor dan tidak terpengaruh.

Penting: file index.json di folder ini adalah daftar seluruh
berkas library (dipakai saat membundel library ke dalam .h5p).
Setiap kali isi folder library berubah, jalankan dari frontend/:
  npm run sync:h5p-index
