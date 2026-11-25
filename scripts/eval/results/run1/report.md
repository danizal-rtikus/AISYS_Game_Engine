# Hasil evaluasi model: run1

- Model: `deepseek-v4-flash`; parameter: `{"temperature":0.4,"max_tokens":32768,"reasoning_effort":"none"}`
- Prompt v2.0, runtime v0.1.0; 22 percobaan (20 utama + 2 jebakan)
- Mulai 2026-11-25T13:36:54.682Z, selesai 2026-11-25T13:46:17.242Z
- selfTest dijalankan di Node: pemeriksaan `render` dilewati dan tidak dihitung (8 pemeriksaan lain dinilai).
- "Perbaikan otomatis" di sini = satu giliran tambahan yang mengirim pesan error ke model dan meminta manifest lengkap (bukan patch SEARCH/REPLACE).

## Metrik vs ambang (Lampiran B)

| Metrik | Hasil | Ambang | Lulus |
|---|---|---|---|
| `finish_reason: "stop"` (giliran manifest) | 22/22 (100%) | ≥ 90% | ✅ |
| Manifest terekstrak dan `isPlayable` | 22/22 (100%) | ≥ 95% | ✅ |
| Lolos validator, percobaan pertama | 22/22 (100%) | ≥ 85% | ✅ |
| selfTest lolos, percobaan pertama | 22/22 (100%) | ≥ 90% | ✅ |
| Lolos setelah ≤ 1 perbaikan otomatis | 22/22 (100%) | ≥ 98% | ✅ |
| Durasi median giliran manifest | 11.4 dtk | < 20 dtk | ✅ |
| `completion_tokens` median giliran manifest | 1003.5 | < 4.000 | ✅ |
| Manifest dengan field di luar cheat-sheet | 0/22 (0%) | < 5% | ✅ |
| PRD jebakan ditangani benar (lolos, tanpa field asing, pengguna diberi tahu lewat `// CATATAN` atau chat) | 2/2 (trap-doublejump: chat, trap-sequence: CATATAN) | 2/2 | ✅ |

Total token seluruh percakapan: input 987.898, output 56.619.

## Per percobaan

| id | giliran | finish | tok | dtk | playable | valid | selfTest | perbaikan | preset | kesulitan | item (kat, min/kat) | peringatan | field asing | CATATAN |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ling-mudah-1 | 7 | stop | 1048 | 7.5 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| ling-mudah-2 | 7 | stop | 927 | 9.6 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 8 (2, 4) | 0 | – | – |
| ling-misk | 7 | stop | 1066 | 11.3 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| ling-arcade | 7 | stop | 487 | 6.4 | ✅ | ✅ | ✅ | – | cartoon | Menantang ✅ | arcade ✅ | 0 | – | – |
| info-mudah-1 | 7 | stop | 972 | 10.5 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 10 (2, 5) | 0 | – | – |
| info-mudah-2 | 8 | stop | 1011 | 10.2 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| info-misk | 7 | stop | 1009 | 12.3 | ✅ | ✅ | ✅ | – | neon | Santai ✅ | 10 (2, 5) | 0 | – | – |
| info-arcade | 7 | stop | 474 | 9.6 | ✅ | ✅ | ✅ | – | neon | Menantang ✅ | arcade ✅ | 0 | – | – |
| bio-mudah-1 | 7 | stop | 1039 | 11.5 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 10 (2, 5) | 0 | – | – |
| bio-mudah-2 | 7 | stop | 1243 | 14.8 | ✅ | ✅ | ✅ | – | cartoon | Santai ✅ | 12 (3, 4) | 0 | – | – |
| bio-misk | 7 | stop | 1177 | 16.4 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 10 (3, 3) | 0 | – | – |
| bio-arcade | 7 | stop | 472 | 6.8 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | arcade ✅ | 0 | – | – |
| eko-mudah-1 | 7 | stop | 998 | 17.2 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 9 (3, 3) | 0 | – | – |
| eko-mudah-2 | 7 | stop | 950 | 11.4 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 8 (2, 4) | 0 | – | – |
| eko-misk | 7 | stop | 976 | 11.8 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 7 (2, 3) | 0 | – | – |
| eko-arcade | 7 | stop | 462 | 5.9 | ✅ | ✅ | ✅ | – | retro-pixel | Menantang ✅ | arcade ✅ | 0 | – | – |
| sej-mudah-1 | 7 | stop | 1109 | 12.8 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | 10 (2, 5) | 0 | – | – |
| sej-mudah-2 | 7 | stop | 1151 | 11.6 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 9 (3, 3) | 0 | – | – |
| sej-misk | 7 | stop | 1219 | 14.3 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | 10 (3, 3) | 0 | – | – |
| sej-arcade | 7 | stop | 492 | 7.1 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | arcade ✅ | 0 | – | – |
| trap-doublejump | 7 | stop | 896 | 7.3 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 6 (2, 3) | 0 | – | – |
| trap-sequence | 7 | stop | 1141 | 12.7 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 9 (3, 3) | 0 | – | ya |

## Konten belajar untuk ditinjau dosen

Klasifikasi dan `explain` di bawah ini **belum diperiksa kebenarannya**. Tandai item yang salah sebelum game dibagikan.

### ling-mudah-1

Kategori: organik=Organik, anorganik=Anorganik, b3=B3. Miskonsepsi: Baterai bekas dianggap sampah anorganik biasa, padahal termasuk B3. 

| Item | Kategori | explain |
|---|---|---|
| Kulit pisang | organik | Sisa makhluk hidup yang mudah terurai dan bisa dijadikan kompos. |
| Daun kering | organik | Bahan alami yang membusuk menjadi kompos. |
| Sisa nasi | organik | Sisa makanan yang cepat membusuk dan bisa dikomposkan. |
| Botol plastik | anorganik | Sulit terurai alami; bisa didaur ulang. |
| Kaleng minuman | anorganik | Logam yang bisa didaur ulang berulang kali. |
| Kantong plastik | anorganik | Sangat lama terurai; kurangi pemakaiannya. |
| Baterai bekas | b3 | Mengandung logam berbahaya; termasuk B3, jangan dibuang ke sampah biasa. |
| Lampu neon bekas | b3 | Mengandung merkuri; perlu penanganan khusus sebagai B3. |
| Obat kedaluwarsa | b3 | Bahan kimianya bisa mencemari tanah dan air; termasuk B3. |

### ling-mudah-2

Kategori: terbarukan=Terbarukan, tidak-terbarukan=Tidak Terbarukan. Miskonsepsi: Energi terbarukan dianggap gratis dan tak terbatas. 

| Item | Kategori | explain |
|---|---|---|
| Sinar matahari | terbarukan | Energi matahari terus tersedia, meski butuh panel dan biaya perawatan. |
| Angin | terbarukan | Angin terbentuk alami dan terus diperbarui, tetapi bergantung cuaca. |
| Aliran air | terbarukan | Aliran air diperbarui lewat siklus hujan, jadi tidak habis. |
| Biomassa | terbarukan | Berasal dari bahan organik yang bisa ditanam kembali. |
| Batu bara | tidak-terbarukan | Terbentuk jutaan tahun; cadangannya akan habis. |
| Minyak bumi | tidak-terbarukan | Bahan bakar fosil dengan cadangan terbatas. |
| Gas alam | tidak-terbarukan | Tetap bahan bakar fosil yang tidak dapat diperbarui. |
| Uranium | tidak-terbarukan | Bahan tambang yang jumlahnya terbatas di bumi. |

### ling-misk

Kategori: organik=Organik, daur-ulang=Anorganik Daur Ulang, sulit-daur-ulang=Sulit Daur Ulang. Miskonsepsi: Semua jenis plastik bisa didaur ulang. 

| Item | Kategori | explain |
|---|---|---|
| Kulit pisang | organik | Sampah alami yang cepat membusuk dan bisa dijadikan kompos. |
| Daun kering | organik | Bahan alami yang terurai menjadi kompos penyubur tanah. |
| Sisa nasi | organik | Sisa makanan yang mudah membusuk dan bisa dikomposkan. |
| Botol plastik | daur-ulang | Plastik PET bernilai tinggi dan mudah didaur ulang jadi produk baru. |
| Kaleng minuman | daur-ulang | Logam aluminium yang bisa didaur ulang berulang kali tanpa rusak. |
| Kertas koran | daur-ulang | Serat kertas bersih bisa diolah kembali menjadi kertas daur ulang. |
| Sedotan plastik | sulit-daur-ulang | Plastik kecil bercampur bahan lain, sulit diproses di fasilitas daur ulang. |
| Styrofoam | sulit-daur-ulang | Plastik berongga bernilai rendah, jarang diterima fasilitas daur ulang. |
| Puntung rokok | sulit-daur-ulang | Campuran serat dan bahan kimia yang tidak bisa didaur ulang. |

### info-mudah-1

Kategori: input=Input, output=Output. Miskonsepsi: Monitor dianggap perangkat input karena bisa disentuh (layar sentuh). 

| Item | Kategori | explain |
|---|---|---|
| Keyboard | input | Memasukkan data berupa huruf dan angka ke komputer. |
| Mouse | input | Menggerakkan kursor dan memberi perintah klik ke komputer. |
| Mikrofon | input | Menangkap suara sebagai data masukan ke komputer. |
| Scanner | input | Memindai dokumen menjadi data digital masukan. |
| Webcam | input | Menangkap gambar dan video sebagai data masukan. |
| Monitor | output | Menampilkan gambar hasil olahan komputer; monitor biasa adalah output. |
| Speaker | output | Mengeluarkan suara hasil olahan komputer. |
| Printer | output | Mencetak hasil olahan komputer ke kertas sebagai keluaran. |
| Proyektor | output | Menampilkan gambar komputer ke layar besar sebagai keluaran. |
| Headset | output | Mengeluarkan suara ke telinga pengguna sebagai keluaran. |

### info-mudah-2

Kategori: fisik=Fisik, data-link=Data Link, network=Network. Miskonsepsi: Switch dan hub dianggap sama saja. 

| Item | Kategori | explain |
|---|---|---|
| Kabel UTP | fisik | Media transmisi sinyal listrik; bekerja di lapisan Fisik. |
| Hub | fisik | Meneruskan sinyal ke semua port tanpa melihat alamat; lapisan Fisik. |
| Repeater | fisik | Memperkuat dan mengulang sinyal; bekerja di lapisan Fisik. |
| Switch | data-link | Meneruskan frame berdasarkan alamat MAC; lapisan Data Link. |
| Bridge | data-link | Menghubungkan segmen jaringan dengan alamat MAC; lapisan Data Link. |
| Kartu Jaringan | data-link | NIC punya alamat MAC unik; bekerja di lapisan Data Link. |
| Router | network | Meneruskan paket berdasarkan alamat IP; lapisan Network. |
| Switch Layer-3 | network | Bisa melakukan routing antar jaringan; bekerja di lapisan Network. |
| Gateway | network | Menghubungkan jaringan berbeda protokol; lapisan Network. |

### info-misk

Kategori: hardware=Hardware, software=Software. Miskonsepsi: Sistem operasi dianggap perangkat keras karena sudah terpasang di komputer. 

| Item | Kategori | explain |
|---|---|---|
| Monitor | hardware | Benda fisik yang bisa disentuh dan dilihat untuk menampilkan gambar. |
| Keyboard | hardware | Perangkat fisik untuk mengetik, bisa dipegang langsung. |
| RAM | hardware | Komponen fisik di dalam komputer untuk menyimpan data sementara. |
| Prosesor | hardware | Chip fisik yang memproses perintah, bisa dipegang. |
| Mouse | hardware | Alat fisik penunjuk kursor yang digerakkan dengan tangan. |
| Sistem Operasi | software | Program tak berwujud yang mengatur kerja komputer, bukan benda fisik. |
| Aplikasi Pengolah Kata | software | Program untuk menulis dokumen; tidak bisa disentuh sebagai benda. |
| Browser | software | Program untuk membuka halaman web, berupa kode bukan benda fisik. |
| Antivirus | software | Program pelindung komputer; berjalan sebagai perangkat lunak. |
| Android | software | Sistem operasi di HP; tetap software meski sudah terpasang. |

### bio-mudah-1

Kategori: vertebrata=Vertebrata, invertebrata=Invertebrata. Miskonsepsi: Semua hewan yang hidup di air adalah ikan (vertebrata). 

| Item | Kategori | explain |
|---|---|---|
| Ikan mas | vertebrata | Punya tulang belakang, termasuk kelompok ikan (Pisces). |
| Katak | vertebrata | Amfibi bertulang belakang; hidup di dua alam. |
| Merpati | vertebrata | Burung (Aves) yang memiliki tulang belakang. |
| Kucing | vertebrata | Mamalia bertulang belakang yang menyusui anaknya. |
| Ular | vertebrata | Reptil bertulang belakang meski tubuhnya panjang dan melata. |
| Ubur-ubur | invertebrata | Hidup di air tapi tanpa tulang belakang; tubuhnya lunak. |
| Cumi-cumi | invertebrata | Moluska tanpa tulang belakang meski hidup di laut. |
| Cacing | invertebrata | Tubuhnya lunak dan tidak memiliki tulang belakang. |
| Siput | invertebrata | Moluska bertubuh lunak tanpa tulang belakang. |
| Belalang | invertebrata | Serangga berkerangka luar, tanpa tulang belakang. |

### bio-mudah-2

Kategori: herbivora=Herbivora, karnivora=Karnivora, omnivora=Omnivora. Miskonsepsi: Semua hewan pemakan daging itu buas dan berbahaya. 

| Item | Kategori | explain |
|---|---|---|
| Sapi | herbivora | Memakan rumput dan tumbuhan, jadi herbivora. |
| Kambing | herbivora | Pemakan daun dan rumput, termasuk herbivora. |
| Kelinci | herbivora | Memakan sayur dan rumput, jadi herbivora. |
| Gajah | herbivora | Memakan daun, buah, dan rumput, jadi herbivora. |
| Singa | karnivora | Pemakan daging, jadi karnivora. |
| Harimau | karnivora | Berburu dan memakan daging, jadi karnivora. |
| Elang | karnivora | Memakan daging hasil buruan, jadi karnivora. |
| Burung pelatuk | karnivora | Pemakan serangga; karnivora tak selalu buas dan berbahaya. |
| Ayam | omnivora | Makan biji, serangga, dan cacing, jadi omnivora. |
| Babi | omnivora | Makan tumbuhan dan hewan kecil, jadi omnivora. |
| Beruang | omnivora | Makan buah, madu, ikan, dan tumbuhan, jadi omnivora. |
| Monyet | omnivora | Makan buah, daun, dan serangga, jadi omnivora. |

### bio-misk

Kategori: mamalia=Mamalia, reptil=Reptil, ikan=Ikan. Miskonsepsi: Paus dan lumba-lumba dianggap ikan karena hidup di air. 

| Item | Kategori | explain |
|---|---|---|
| Lumba-lumba | mamalia | Bernapas dengan paru-paru dan menyusui anaknya; mamalia, bukan ikan. |
| Paus | mamalia | Hidup di air tapi bernapas dengan paru-paru dan melahirkan; mamalia. |
| Kelelawar | mamalia | Berbulu, melahirkan, dan menyusui; mamalia meski bisa terbang. |
| Kucing | mamalia | Berbulu, melahirkan, dan menyusui anaknya; mamalia. |
| Kadal | reptil | Bersisik, berdarah dingin, dan bertelur; reptil. |
| Ular | reptil | Bertubuh bersisik dan bertelur; reptil walau tanpa kaki. |
| Penyu | reptil | Bercangkang keras, bertelur di pasir; reptil. |
| Hiu | ikan | Bernapas dengan insang dan bertelur atau melahirkan; ikan. |
| Salmon | ikan | Bernapas dengan insang dan bertelur; ikan. |
| Kuda laut | ikan | Bernapas dengan insang dan bertelur; ikan walau bentuknya unik. |

### eko-mudah-1

Kategori: primer=Primer, sekunder=Sekunder, tersier=Tersier. Miskonsepsi: Semua yang dibutuhkan untuk hidup dianggap kebutuhan primer. 

| Item | Kategori | explain |
|---|---|---|
| Beras | primer | Makanan pokok yang wajib dipenuhi lebih dulu. |
| Air minum | primer | Kebutuhan dasar tubuh; harus dipenuhi paling awal. |
| Rumah sederhana | primer | Tempat tinggal adalah kebutuhan papan yang mendasar. |
| Sepeda | sekunder | Alat transportasi pelengkap; dipenuhi setelah kebutuhan dasar. |
| Buku pelajaran | sekunder | Penting untuk belajar, tetapi bukan kebutuhan paling dasar. |
| Kulkas | sekunder | Membantu menyimpan makanan, namun tetap pelengkap. |
| Mobil mewah | tersier | Barang prestise untuk kenyamanan, bukan kebutuhan pokok. |
| Perhiasan emas | tersier | Dipenuhi untuk gaya hidup setelah kebutuhan lain terpenuhi. |
| Liburan luar negeri | tersier | Kebutuhan mewah yang bersifat hiburan, bukan keharusan. |

### eko-mudah-2

Kategori: konsumsi=Barang Konsumsi, modal=Barang Modal. Miskonsepsi: Semua benda mahal dianggap barang modal. 

| Item | Kategori | explain |
|---|---|---|
| Nasi | konsumsi | Makanan pokok yang langsung dikonsumsi untuk memenuhi kebutuhan. |
| Sepatu | konsumsi | Dipakai pribadi untuk melindungi kaki, bukan untuk produksi. |
| Sabun | konsumsi | Dipakai langsung untuk kebersihan diri, habis sekali pakai. |
| Kulkas rumah tangga | konsumsi | Meski mahal, dipakai keluarga untuk menyimpan makanan, bukan produksi. |
| Mesin jahit | modal | Alat produksi untuk membuat pakaian yang akan dijual. |
| Traktor | modal | Dipakai mengolah lahan pertanian untuk menghasilkan panen. |
| Oven pabrik | modal | Alat produksi roti dalam jumlah besar untuk dijual. |
| Bor listrik | modal | Alat kerja untuk merakit atau memperbaiki barang produksi. |

### eko-misk

Kategori: pusat=Pajak Pusat, daerah=Pajak Daerah. Miskonsepsi: Pajak Kendaraan Bermotor dianggap pajak pusat. 

| Item | Kategori | explain |
|---|---|---|
| PPh | pusat | Pajak Penghasilan dipungut pemerintah pusat atas penghasilan. |
| PPN | pusat | Pajak Pertambahan Nilai atas barang/jasa, dipungut pemerintah pusat. |
| Bea Meterai | pusat | Pajak atas dokumen tertentu, dipungut pemerintah pusat. |
| Pajak Kendaraan Bermotor | daerah | Dipungut pemerintah provinsi, jadi termasuk pajak daerah, bukan pusat. |
| Pajak Hotel | daerah | Pajak daerah yang dipungut pemerintah kabupaten/kota. |
| Pajak Restoran | daerah | Pajak daerah yang dipungut pemerintah kabupaten/kota. |
| PBB-P2 | daerah | PBB Perdesaan dan Perkotaan dipungut pemerintah daerah. |

### sej-mudah-1

Kategori: hindu-buddha=Hindu-Buddha, islam=Islam. Miskonsepsi: Majapahit dianggap kerajaan Islam padahal bercorak Hindu-Buddha. 

| Item | Kategori | explain |
|---|---|---|
| Candi Borobudur | hindu-buddha | Candi Buddha peninggalan Dinasti Syailendra. |
| Candi Prambanan | hindu-buddha | Candi Hindu Siwa peninggalan Wangsa Sanjaya. |
| Prasasti Yupa | hindu-buddha | Prasasti tertua Kutai, bercorak Hindu. |
| Negarakertagama | hindu-buddha | Kitab pujangga Mpu Prapanca dari Majapahit yang Hindu-Buddha. |
| Patih Gajah Mada | hindu-buddha | Mahapatih Majapahit, kerajaan bercorak Hindu-Buddha. |
| Masjid Agung Demak | islam | Masjid peninggalan Kesultanan Demak, kerajaan Islam. |
| Masjid Kudus | islam | Masjid bercorak Islam dengan menara bata khas. |
| Samudera Pasai | islam | Kesultanan Islam pertama di Nusantara, di Aceh. |
| Kesultanan Aceh | islam | Kesultanan Islam maritim yang berpusat di Aceh. |
| Raden Patah | islam | Pendiri Kesultanan Demak, kerajaan Islam di Jawa. |

### sej-mudah-2

Kategori: proklamator=Proklamator, perumus=Perumus Naskah, sumpah=Tokoh Sumpah Pemuda. Miskonsepsi: Teks Proklamasi ditulis Soekarno seorang diri. 

| Item | Kategori | explain |
|---|---|---|
| Soekarno | proklamator | Membacakan teks Proklamasi pada 17 Agustus 1945. |
| Mohammad Hatta | proklamator | Mendampingi Soekarno menandatangani teks Proklamasi. |
| Fatmawati | proklamator | Menjahit bendera pusaka yang dikibarkan saat Proklamasi. |
| Achmad Soebardjo | perumus | Ikut merumuskan naskah Proklamasi bersama Soekarno dan Hatta. |
| Sayuti Melik | perumus | Mengetik naskah Proklamasi hasil rumusan para tokoh. |
| BM Diah | perumus | Menyimpan naskah asli Proklamasi yang sempat dibuang. |
| WR Supratman | sumpah | Pencipta lagu Indonesia Raya yang dikumandangkan di Kongres Pemuda II. |
| Mohammad Yamin | sumpah | Ikut merumuskan isi Sumpah Pemuda dalam Kongres Pemuda II. |
| Soegondo Djojopoespito | sumpah | Ketua Kongres Pemuda II yang melahirkan Sumpah Pemuda. |

### sej-misk

Kategori: sebelum=Sebelum Proklamasi, saat=Saat Proklamasi, sesudah=Sesudah Proklamasi. Miskonsepsi: Sumpah Pemuda terjadi setelah Proklamasi Kemerdekaan. 

| Item | Kategori | explain |
|---|---|---|
| Peristiwa Rengasdengklok | sebelum | Terjadi 16 Agustus 1945, sehari sebelum proklamasi. |
| Perumusan teks proklamasi | sebelum | Dirumuskan malam 16 Agustus di rumah Laksamana Maeda. |
| Jepang menyerah kepada Sekutu | sebelum | Kekosongan kekuasaan ini mendorong percepatan proklamasi. |
| Sumpah Pemuda 1928 | sebelum | Terjadi 28 Oktober 1928, 17 tahun sebelum proklamasi. |
| Pembacaan teks proklamasi | saat | Dibacakan Soekarno di Pegangsaan Timur 56 pada 17 Agustus 1945. |
| Pengibaran bendera Merah Putih | saat | Bendera dikibarkan usai teks proklamasi dibacakan. |
| Lagu Indonesia Raya dikumandangkan | saat | Dinyanyikan bersama setelah pembacaan proklamasi. |
| Penyebaran berita proklamasi | sesudah | Berita disiarkan lewat radio dan surat kabar ke seluruh daerah. |
| Sidang PPKI pertama | sesudah | Digelar 18 Agustus 1945, sehari setelah proklamasi. |
| Pemilihan presiden dan wakil presiden | sesudah | Soekarno dan Hatta dipilih dalam sidang PPKI 18 Agustus 1945. |

### trap-doublejump

Kategori: organik=Organik, anorganik=Anorganik. Miskonsepsi: Sampah anorganik seperti plastik dan kaleng akan cepat terurai sendiri seperti sampah organik. 

| Item | Kategori | explain |
|---|---|---|
| Kulit pisang | organik | Bahan alami yang cepat membusuk dan bisa dijadikan kompos. |
| Daun kering | organik | Sisa tumbuhan yang terurai alami menjadi kompos. |
| Sisa nasi | organik | Sisa makanan yang cepat membusuk dan bisa dikomposkan. |
| Botol plastik | anorganik | Plastik butuh ratusan tahun terurai; harus didaur ulang, bukan terurai cepat. |
| Kaleng minuman | anorganik | Logam tidak membusuk seperti sampah organik; perlu didaur ulang. |
| Kantong plastik | anorganik | Sangat lama terurai dan tidak bisa dikomposkan seperti sampah organik. |

### trap-sequence

Kategori: perbandingan=Perbandingan, penukaran=Penukaran, lanjut=Lanjut. Miskonsepsi: Satu putaran sudah cukup untuk mengurutkan. 

| Item | Kategori | explain |
|---|---|---|
| Bandingkan A[i] dan A[i+1] | perbandingan | Memeriksa dua elemen bersebelahan sebelum memutuskan tukar. |
| Cek A[i] > A[i+1] | perbandingan | Menentukan apakah urutan salah dan perlu ditukar. |
| Tandai posisi dibandingkan | perbandingan | Mencatat pasangan yang sedang dicek dalam putaran. |
| Tukar A[i] dan A[i+1] | penukaran | Menukar dua elemen bersebelahan yang urutannya salah. |
| Simpan nilai sementara | penukaran | Variabel bantu agar salah satu nilai tidak hilang saat ditukar. |
| Letakkan nilai ke posisi baru | penukaran | Menempatkan hasil tukar ke posisi yang benar. |
| Naikkan indeks i | lanjut | Bergerak ke pasangan berikutnya untuk dibandingkan. |
| Pindah ke pasangan berikutnya | lanjut | Melanjutkan penyusuran array ke kanan. |
| Mulai putaran baru | lanjut | Satu putaran belum tentu terurut; algoritma harus mengulang. |

