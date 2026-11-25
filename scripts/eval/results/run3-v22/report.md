# Hasil evaluasi model: run3-v22

- Model: `deepseek-v4-flash`; parameter: `{"temperature":0.4,"max_tokens":32768,"reasoning_effort":"none"}`
- Prompt v2.2, runtime v0.1.0; 24 percobaan (22 utama + 2 jebakan)
- Mulai 2026-11-25T14:06:48.452Z, selesai 2026-11-25T14:18:13.308Z
- selfTest dijalankan di Node: pemeriksaan `render` dilewati dan tidak dihitung (8 pemeriksaan lain dinilai).
- "Perbaikan otomatis" di sini = satu giliran tambahan yang mengirim pesan error ke model dan meminta manifest lengkap (bukan patch SEARCH/REPLACE).

## Metrik vs ambang (Lampiran B)

| Metrik | Hasil | Ambang | Lulus |
|---|---|---|---|
| `finish_reason: "stop"` (giliran manifest) | 24/24 (100%) | ≥ 90% | ✅ |
| Manifest terekstrak dan `isPlayable` | 24/24 (100%) | ≥ 95% | ✅ |
| Lolos validator, percobaan pertama | 24/24 (100%) | ≥ 85% | ✅ |
| selfTest lolos, percobaan pertama | 24/24 (100%) | ≥ 90% | ✅ |
| Lolos setelah ≤ 1 perbaikan otomatis | 24/24 (100%) | ≥ 98% | ✅ |
| Durasi median giliran manifest | 10.7 dtk | < 20 dtk | ✅ |
| `completion_tokens` median giliran manifest | 1002 | < 4.000 | ✅ |
| Manifest dengan field di luar cheat-sheet | 0/24 (0%) | < 5% | ✅ |
| PRD jebakan ditangani benar (lolos, tanpa field asing, pengguna diberi tahu lewat `// CATATAN` atau chat) | 1/2 (trap-doublejump: chat, trap-sequence: tidak) | 2/2 | ❌ |

Total token seluruh percakapan: input 1.135.690, output 62.885.

## Per percobaan

| id | giliran | finish | tok | dtk | playable | valid | selfTest | perbaikan | preset | kesulitan | item (kat, min/kat) | peringatan | field asing | CATATAN |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ling-mudah-1 | 7 | stop | 1028 | 10.7 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| ling-mudah-2 | 7 | stop | 857 | 10.5 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 6 (2, 3) | 0 | – | – |
| ling-misk | 7 | stop | 1021 | 6.7 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 8 (2, 4) | 0 | – | – |
| ling-arcade | 7 | stop | 471 | 10.2 | ✅ | ✅ | ✅ | – | cartoon | Menantang ✅ | arcade ✅ | 0 | – | – |
| info-mudah-1 | 7 | stop | 877 | 11.3 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 8 (2, 4) | 0 | – | – |
| info-mudah-2 | 7 | stop | 985 | 10.7 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| info-misk | 7 | stop | 956 | 11.3 | ✅ | ✅ | ✅ | – | neon | Santai ✅ | 10 (2, 5) | 0 | – | – |
| info-arcade | 7 | stop | 430 | 13.6 | ✅ | ✅ | ✅ | – | neon | Menantang ✅ | arcade ✅ | 0 | – | – |
| bio-mudah-1 | 7 | stop | 1137 | 12.7 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 12 (2, 6) | 0 | – | – |
| bio-mudah-2 | 7 | stop | 1100 | 12.5 | ✅ | ✅ | ✅ | – | cartoon | Santai ✅ | 9 (3, 3) | 0 | – | – |
| bio-misk | 7 | stop | 1027 | 10.9 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 9 (3, 3) | 0 | – | – |
| bio-arcade | 7 | stop | 477 | 10.5 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | arcade ✅ | 0 | – | – |
| eko-mudah-1 | 7 | stop | 1123 | 6.9 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 12 (3, 4) | 0 | – | – |
| eko-mudah-2 | 7 | stop | 937 | 7.1 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 8 (2, 4) | 0 | – | – |
| eko-misk | 7 | stop | 952 | 8.3 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 7 (2, 3) | 0 | – | – |
| eko-arcade | 7 | stop | 457 | 7.1 | ✅ | ✅ | ✅ | – | retro-pixel | Menantang ✅ | arcade ✅ | 0 | – | – |
| sej-mudah-1 | 7 | stop | 1051 | 13.6 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | 9 (3, 3) | 0 | – | – |
| sej-mudah-2 | 7 | stop | 1019 | 10.6 | ✅ | ✅ | ✅ | – | clean-modern | Santai ✅ | 7 (3, 1) | 0 | – | – |
| sej-misk | 7 | stop | 1385 | 15.5 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | 11 (3, 3) | 0 | – | – |
| sej-arcade | 7 | stop | 425 | 6.8 | ✅ | ✅ | ✅ | – | retro-pixel | Normal ✅ | arcade ✅ | 0 | – | – |
| trap-doublejump | 7 | stop | 907 | 14.6 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 7 (2, 3) | 0 | – | – |
| trap-sequence | 7 | stop | 1092 | 12.3 | ✅ | ✅ | ✅ | – | neon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| bio-holdout | 7 | stop | 1061 | 8.0 | ✅ | ✅ | ✅ | – | cartoon | Normal ✅ | 9 (3, 3) | 0 | – | – |
| eko-holdout | 8 | stop | 1095 | 12.5 | ✅ | ✅ | ✅ | – | clean-modern | Normal ✅ | 9 (3, 3) | 0 | – | – |

## Konten belajar untuk ditinjau dosen

Klasifikasi dan `explain` di bawah ini **belum diperiksa kebenarannya**. Tandai item yang salah sebelum game dibagikan.

### ling-mudah-1

Kategori: organik=Organik, anorganik=Anorganik, b3=B3. Miskonsepsi: Baterai bekas dianggap sampah anorganik biasa, padahal termasuk B3. 

| Item | Kategori | explain |
|---|---|---|
| Kulit pisang | organik | Bahan alami yang mudah membusuk dan bisa dijadikan kompos. |
| Daun kering | organik | Bahan alami yang terurai menjadi kompos. |
| Sisa nasi | organik | Sisa makanan yang cepat membusuk dan bisa dikomposkan. |
| Botol plastik | anorganik | Bahan buatan yang sulit terurai; bisa didaur ulang. |
| Kaleng minuman | anorganik | Logam buatan yang bisa didaur ulang berulang kali. |
| Kantong plastik | anorganik | Sangat lama terurai; kurangi pemakaiannya. |
| Baterai bekas | b3 | Mengandung logam berbahaya; termasuk B3, bukan anorganik biasa. |
| Lampu neon bekas | b3 | Mengandung merkuri; perlu penanganan khusus sebagai B3. |
| Obat kedaluwarsa | b3 | Bahan kimianya bisa mencemari tanah dan air; termasuk B3. |

### ling-mudah-2

Kategori: terbarukan=Terbarukan, tidak-terbarukan=Tidak Terbarukan. Miskonsepsi: Energi terbarukan berarti energinya tidak akan pernah habis sama sekali. 

| Item | Kategori | explain |
|---|---|---|
| Sinar matahari | terbarukan | Terus tersedia dan diperbarui oleh alam setiap hari. |
| Angin | terbarukan | Terbentuk terus-menerus oleh pemanasan atmosfer. |
| Aliran air | terbarukan | Siklus air diperbarui oleh hujan dan gravitasi. |
| Batu bara | tidak-terbarukan | Terbentuk dari fosil selama jutaan tahun. |
| Minyak bumi | tidak-terbarukan | Cadangan fosil yang terbatas dan sangat lambat terbentuk. |
| Gas alam | tidak-terbarukan | Sumber fosil yang akan habis jika terus dipakai. |

### ling-misk

Kategori: dapat=Dapat Didaur Ulang, tidak=Tidak Didaur Ulang. Miskonsepsi: Semua jenis plastik bisa didaur ulang. 

| Item | Kategori | explain |
|---|---|---|
| Botol plastik PET | dapat | Plastik nomor 1, mudah didaur ulang menjadi serat atau plastik baru. |
| Kaleng aluminium | dapat | Logam bernilai tinggi yang bisa didaur ulang berulang kali. |
| Koran bekas | dapat | Kertas bersih dapat diproses kembali menjadi kertas daur ulang. |
| Kardus | dapat | Karton bersih mudah didaur ulang menjadi kertas kemasan baru. |
| Puntung rokok | tidak | Mengandung filter kimia; tidak dapat didaur ulang. |
| Pampers sekali pakai | tidak | Campuran bahan sulit dipisah; tidak didaur ulang. |
| Styrofoam wadah | tidak | Plastik sekali pakai yang sulit didaur ulang, bukan semua plastik bisa. |
| Sedotan plastik | tidak | Plastik kecil sekali pakai yang tidak diterima fasilitas daur ulang. |

### info-mudah-1

Kategori: input=Input, output=Output. Miskonsepsi: Monitor dan printer dianggap perangkat input karena bisa disentuh dan dipegang. 

| Item | Kategori | explain |
|---|---|---|
| Keyboard | input | Mengetik huruf dan angka agar masuk ke komputer. |
| Mouse | input | Menggerakkan kursor dan memberi perintah klik ke komputer. |
| Scanner | input | Memindai dokumen menjadi data digital masuk ke komputer. |
| Mikrofon | input | Menangkap suara dan mengubahnya menjadi data untuk komputer. |
| Monitor | output | Menampilkan gambar dan teks hasil olahan komputer. |
| Printer | output | Mencetak hasil olahan komputer ke kertas. |
| Speaker | output | Mengeluarkan suara dari komputer. |
| Proyektor | output | Menampilkan gambar dari komputer ke layar besar. |

### info-mudah-2

Kategori: physical=Physical, data-link=Data Link, network=Network. Miskonsepsi: Hub dan Switch dianggap perangkat yang sama, padahal Hub bekerja di Physical dan Switch di Data Link. 

| Item | Kategori | explain |
|---|---|---|
| Hub | physical | Meneruskan sinyal ke semua port tanpa membaca alamat; bekerja di lapisan fisik. |
| Repeater | physical | Memperkuat dan memperpanjang sinyal mentah di lapisan fisik. |
| Kabel UTP | physical | Media transmisi fisik berupa kabel tembaga penghantar sinyal. |
| Switch | data-link | Meneruskan frame berdasarkan MAC address; bekerja di lapisan data link. |
| Bridge | data-link | Menghubungkan dua segmen jaringan berdasarkan alamat MAC. |
| Kartu NIC | data-link | Antarmuka jaringan yang memiliki alamat MAC; bekerja di data link. |
| Router | network | Mengarahkan paket antarjaringan berdasarkan alamat IP. |
| Modem | network | Mengubah sinyal untuk akses jaringan dan meneruskan paket data. |
| Access Point | network | Menghubungkan perangkat nirkabel ke jaringan lokal. |

### info-misk

Kategori: hardware=Hardware, software=Software. Miskonsepsi: Sistem operasi dianggap hardware karena sudah terpasang di komputer. 

| Item | Kategori | explain |
|---|---|---|
| Monitor | hardware | Perangkat output fisik yang menampilkan gambar di layar. |
| Keyboard | hardware | Alat input fisik berisi tombol untuk mengetik. |
| Mouse | hardware | Alat penunjuk fisik untuk menggerakkan kursor. |
| Printer | hardware | Perangkat fisik yang mencetak dokumen ke kertas. |
| CPU | hardware | Chip pemroses fisik yang menjalankan instruksi. |
| Sistem operasi | software | Program utama pengelola hardware; berupa kode, bukan benda fisik. |
| Aplikasi pengolah kata | software | Program untuk menulis dan mengedit dokumen. |
| Browser | software | Program untuk membuka dan menjelajah halaman web. |
| Antivirus | software | Program yang mendeteksi dan menghapus malware. |
| Driver | software | Program penghubung agar hardware dikenali sistem. |

### bio-mudah-1

Kategori: vertebrata=Vertebrata, invertebrata=Invertebrata. Miskonsepsi: Semua hewan yang hidup di air adalah ikan. 

| Item | Kategori | explain |
|---|---|---|
| Ikan mas | vertebrata | Ikan bertulang belakang sejati, termasuk vertebrata. |
| Katak | vertebrata | Amfibi yang memiliki tulang belakang. |
| Burung merpati | vertebrata | Aves bertulang belakang, termasuk vertebrata. |
| Ular kobra | vertebrata | Reptil bertulang belakang meski tidak berkaki. |
| Lumba-lumba | vertebrata | Mamalia air bertulang belakang; bukan ikan. |
| Kucing | vertebrata | Mamalia darat yang memiliki tulang belakang. |
| Cacing tanah | invertebrata | Annelida tanpa tulang belakang. |
| Ubur-ubur | invertebrata | Hewan air tanpa tulang belakang; bukan ikan. |
| Cumi-cumi | invertebrata | Moluska air tanpa tulang belakang; bukan ikan. |
| Belalang | invertebrata | Arthropoda tanpa tulang belakang. |
| Siput | invertebrata | Moluska berbadan lunak tanpa tulang belakang. |
| Bintang laut | invertebrata | Echinodermata tanpa tulang belakang. |

### bio-mudah-2

Kategori: herbivora=Herbivora, karnivora=Karnivora, omnivora=Omnivora. Miskonsepsi: Semua hewan yang makan daging itu karnivora sejati, padahal ayam dan beruang juga makan tumbuhan sehingga omnivora. 

| Item | Kategori | explain |
|---|---|---|
| Sapi | herbivora | Memakan rumput dan dedaunan sebagai sumber utama. |
| Kambing | herbivora | Pemakan tumbuhan dan daun. |
| Kelinci | herbivora | Memakan sayuran, rumput, dan wortel. |
| Harimau | karnivora | Pemangsa daging hasil berburu. |
| Singa | karnivora | Pemakan daging hasil berburu. |
| Elang | karnivora | Burung pemangsa yang memakan daging. |
| Ayam | omnivora | Makan biji-bijian sekaligus cacing dan serangga. |
| Babi | omnivora | Makan tumbuhan maupun makanan hewani. |
| Beruang | omnivora | Makan buah, ikan, dan hewan kecil. |

### bio-misk

Kategori: mamalia=Mamalia, reptil=Reptil, ikan=Ikan. Miskonsepsi: Paus dan lumba-lumba dianggap ikan karena hidup di air. 

| Item | Kategori | explain |
|---|---|---|
| Kucing | mamalia | Berbulu dan menyusui anaknya, ciri khas mamalia. |
| Lumba-lumba | mamalia | Mamalia laut: bernapas dengan paru-paru dan menyusui. |
| Kelelawar | mamalia | Mamalia bersayap yang menyusui anaknya. |
| Komodo | reptil | Reptil terbesar, bersisik dan bertelur. |
| Penyu | reptil | Reptil bercangkang yang bertelur di pasir. |
| Buaya | reptil | Reptil bersisik dan pemangsa di perairan. |
| Hiu | ikan | Ikan yang bernapas dengan insang, bukan mamalia. |
| Koi | ikan | Ikan air tawar yang bernapas dengan insang. |
| Tuna | ikan | Ikan laut yang bernapas dengan insang. |

### eko-mudah-1

Kategori: primer=Primer, sekunder=Sekunder, tersier=Tersier. Miskonsepsi: Semua benda mahal otomatis termasuk kebutuhan tersier. 

| Item | Kategori | explain |
|---|---|---|
| Beras | primer | Makanan pokok sehari-hari yang wajib dipenuhi. |
| Air minum | primer | Kebutuhan dasar tubuh yang tidak bisa ditunda. |
| Pakaian sehari-hari | primer | Melindungi tubuh; kebutuhan dasar sandang. |
| Obat saat sakit | primer | Kebutuhan mendesak untuk kesehatan; mahal bukan berarti tersier. |
| Sepeda motor | sekunder | Alat transportasi penunjang aktivitas, bukan kebutuhan pokok. |
| Telepon seluler | sekunder | Alat komunikasi yang menambah kenyamanan. |
| Kulkas | sekunder | Membantu menyimpan makanan; pelengkap, bukan pokok. |
| Kipas angin | sekunder | Memberi kenyamanan, bukan kebutuhan dasar. |
| Perhiasan emas | tersier | Barang mewah untuk prestise, bukan kebutuhan pokok. |
| Mobil mewah | tersier | Kendaraan mewah untuk gengsi, bukan kebutuhan dasar. |
| Liburan luar negeri | tersier | Rekreasi mewah, bukan kebutuhan dasar. |
| Jam tangan desainer | tersier | Aksesori prestise bernilai tinggi. |

### eko-mudah-2

Kategori: konsumsi=Barang Konsumsi, modal=Barang Modal. Miskonsepsi: Semua barang mahal adalah barang modal. 

| Item | Kategori | explain |
|---|---|---|
| Nasi | konsumsi | Makanan pokok yang langsung dikonsumsi untuk kebutuhan energi. |
| Sepatu | konsumsi | Dipakai langsung untuk melindungi kaki; tetap konsumsi meski mahal. |
| Sabun mandi | konsumsi | Dipakai langsung untuk kebersihan diri dan habis sekali pakai. |
| Tas branded | konsumsi | Dipakai langsung sebagai pelengkap penampilan; mahal bukan berarti modal. |
| Mesin jahit | modal | Dipakai pengrajin untuk memproduksi pakaian, bukan dikonsumsi langsung. |
| Traktor | modal | Alat petani mengolah sawah agar menghasilkan panen. |
| Gerobak dagang | modal | Sarana pedagang menjual barang untuk menghasilkan pendapatan. |
| Oven pabrik | modal | Dipakai memanggang roti dalam jumlah besar untuk dijual. |

### eko-misk

Kategori: pusat=Pajak Pusat, daerah=Pajak Daerah. Miskonsepsi: Pajak Kendaraan Bermotor dianggap pajak pusat, padahal dipungut pemerintah provinsi (pajak daerah). 

| Item | Kategori | explain |
|---|---|---|
| PPh | pusat | Pajak Penghasilan dipungut pemerintah pusat atas penghasilan wajib pajak. |
| PPN | pusat | Pajak Pertambahan Nilai dipungut pemerintah pusat atas konsumsi barang dan jasa. |
| Bea Meterai | pusat | Dipungut pemerintah pusat atas dokumen tertentu. |
| Pajak Hotel | daerah | Dipungut pemerintah kabupaten/kota atas jasa penginapan. |
| Pajak Restoran | daerah | Dipungut pemerintah kabupaten/kota atas jasa makanan dan minuman. |
| PBB | daerah | Pajak Bumi dan Bangunan dipungut pemerintah daerah atas bumi dan bangunan. |
| Pajak Kendaraan Bermotor | daerah | Dipungut pemerintah provinsi atas kepemilikan kendaraan bermotor. |

### sej-mudah-1

Kategori: candi-hindu=Candi Hindu, candi-buddha=Candi Buddha, masjid=Masjid. Miskonsepsi: Candi Borobudur dianggap candi Hindu, padahal candi Buddha. 

| Item | Kategori | explain |
|---|---|---|
| Candi Prambanan | candi-hindu | Candi Hindu terbesar di Indonesia, peninggalan Mataram Kuno. |
| Candi Gedong Songo | candi-hindu | Kompleks candi Hindu di lereng Gunung Ungaran. |
| Candi Sukuh | candi-hindu | Candi Hindu bercorak unik di lereng Gunung Lawu. |
| Candi Borobudur | candi-buddha | Candi Buddha terbesar di dunia, peninggalan Dinasti Syailendra. |
| Candi Mendut | candi-buddha | Candi Buddha di dekat Borobudur dengan arca Buddha besar. |
| Candi Sewu | candi-buddha | Kompleks candi Buddha di dekat Prambanan. |
| Masjid Demak | masjid | Masjid tertua di Jawa, peninggalan Kesultanan Demak. |
| Masjid Kudus | masjid | Masjid dengan menara berbentuk candi, bukti akulturasi. |
| Masjid Banten | masjid | Masjid peninggalan Kesultanan Banten. |

### sej-mudah-2

Kategori: proklamator=Proklamator, perumus-sumpah-pemuda=Perumus Sumpah Pemuda, bukan-proklamator=Bukan Proklamator. Miskonsepsi: Fatmawati dianggap proklamator karena menjahit bendera pusaka. 

| Item | Kategori | explain |
|---|---|---|
| Soekarno | proklamator | Membacakan teks proklamasi pada 17 Agustus 1945. |
| Mohammad Hatta | proklamator | Mendampingi dan turut menandatangani teks proklamasi. |
| Achmad Soebardjo | proklamator | Turut menyusun naskah proklamasi di rumah Laksamana Maeda. |
| Moehammad Yamin | perumus-sumpah-pemuda | Mengusulkan rumusan Sumpah Pemuda dalam Kongres Pemuda II. |
| Soegondo Djojopoespito | perumus-sumpah-pemuda | Ketua Kongres Pemuda II yang memimpin perumusan. |
| Wage Rudolf Supratman | perumus-sumpah-pemuda | Menciptakan lagu Indonesia Raya untuk Kongres Pemuda II. |
| Fatmawati | bukan-proklamator | Menjahit bendera pusaka, bukan penanda tangan teks proklamasi. |

### sej-misk

Kategori: sebelum=Sebelum Proklamasi, saat=Saat Proklamasi, sesudah=Sesudah Proklamasi. Miskonsepsi: Sumpah Pemuda terjadi setelah proklamasi kemerdekaan. 

| Item | Kategori | explain |
|---|---|---|
| Sumpah Pemuda | sebelum | Ikrar 28 Oktober 1928, jauh sebelum proklamasi 1945. |
| Peristiwa Rengasdengklok | sebelum | 16 Agustus 1945, golongan muda mendesak Soekarno-Hatta. |
| Bom Hiroshima | sebelum | 6 Agustus 1945, memicu Jepang menyerah kepada Sekutu. |
| Perumusan teks proklamasi | sebelum | Malam 16-17 Agustus 1945 di rumah Laksamana Maeda. |
| Pembacaan teks proklamasi | saat | Dibacakan Soekarno di Pegangsaan Timur 56, 17 Agustus 1945. |
| Pengibaran bendera pusaka | saat | Oleh Latief Hendraningrat dan Suhud pada 17 Agustus 1945. |
| Sambutan Soekarno | saat | Pidato singkat setelah pembacaan teks proklamasi. |
| Sidang PPKI | sesudah | 18 Agustus 1945, mengesahkan UUD 1945 dan memilih presiden. |
| Penyebaran berita proklamasi | sesudah | Lewat radio dan kurir ke berbagai daerah setelah 17 Agustus. |
| Pertempuran Surabaya | sesudah | 10 November 1945, terjadi setelah proklamasi kemerdekaan. |
| Pengesahan UUD 1945 | sesudah | Disahkan PPKI pada 18 Agustus 1945, sehari setelah proklamasi. |

### trap-doublejump

Kategori: organik=Organik, anorganik=Anorganik. Miskonsepsi: Semua sampah plastik pasti bisa didaur ulang. 

| Item | Kategori | explain |
|---|---|---|
| Kulit pisang | organik | Sisa makhluk hidup; terurai alami dan bisa dijadikan kompos. |
| Daun kering | organik | Bahan alami dari tumbuhan yang membusuk menjadi kompos. |
| Sisa nasi | organik | Sisa makanan yang cepat membusuk dan bisa dikomposkan. |
| Botol plastik | anorganik | Sulit terurai, tetapi jenis plastik ini bisa didaur ulang. |
| Kaleng minuman | anorganik | Logam buatan; bisa didaur ulang berulang kali. |
| Kantong plastik | anorganik | Sangat sulit didaur ulang; sebaiknya dikurangi pemakaiannya. |
| Styrofoam | anorganik | Praktis tidak bisa didaur ulang; sebaiknya dihindari. |

### trap-sequence

Kategori: bandingkan=Bandingkan, tukar=Tukar, selesai=Selesai Putaran. Miskonsepsi: Bubble Sort menukar elemen berjauhan, padahal hanya membandingkan dan menukar dua elemen bersebelahan. 

| Item | Kategori | explain |
|---|---|---|
| Bandingkan A[i] dan A[i+1] | bandingkan | Membandingkan dua elemen yang bersebelahan. |
| Cek A[i] > A[i+1] | bandingkan | Memeriksa urutan dua elemen bertetangga. |
| Lihat pasangan bersebelahan | bandingkan | Fokus pada dua elemen yang berdampingan. |
| Tukar A[i] dengan A[i+1] | tukar | Menukar dua elemen bersebelahan yang salah urutan. |
| Geser elemen besar ke kanan | tukar | Elemen besar berpindah satu posisi ke kanan. |
| Swap posisi dua elemen | tukar | Menukar posisi dua elemen bertetangga. |
| Elemen terbesar ke ujung | selesai | Elemen terbesar menempati posisi akhir setelah satu putaran. |
| Kurangi rentang perbandingan | selesai | Batas perbandingan menyusut tiap putaran. |
| Putaran selesai, ulangi | selesai | Satu iterasi tuntas, lanjut iterasi berikutnya. |

### bio-holdout

Kategori: pencernaan=Pencernaan, pernapasan=Pernapasan, peredaran=Peredaran Darah. Miskonsepsi: Jantung hanya memompa darah ke paru-paru, padahal jantung memompa darah ke seluruh tubuh melalui peredaran besar dan kecil. 

| Item | Kategori | explain |
|---|---|---|
| Lambung | pencernaan | Mencerna makanan secara mekanik dan kimia. |
| Usus halus | pencernaan | Menyerap sari-sari makanan hasil pencernaan. |
| Kerongkongan | pencernaan | Menyalurkan makanan dari mulut ke lambung. |
| Paru-paru | pernapasan | Tempat pertukaran oksigen dan karbon dioksida. |
| Trakea | pernapasan | Saluran udara dari hidung menuju paru-paru. |
| Diafragma | pernapasan | Otot yang membantu proses pernapasan. |
| Jantung | peredaran | Memompa darah ke seluruh tubuh lewat peredaran besar dan kecil. |
| Arteri | peredaran | Pembuluh yang membawa darah keluar dari jantung. |
| Vena | peredaran | Pembuluh yang membawa darah kembali ke jantung. |

### eko-holdout

Kategori: konsumen=Rumah Tangga Konsumen, produsen=Rumah Tangga Produsen, pemerintah=Pemerintah. Miskonsepsi: Pemerintah tidak termasuk pelaku ekonomi karena hanya mengatur, bukan melakukan kegiatan ekonomi. 

| Item | Kategori | explain |
|---|---|---|
| Membeli barang di pasar | konsumen | Rumah tangga membeli barang untuk memenuhi kebutuhan konsumsi. |
| Membayar listrik | konsumen | Membayar jasa untuk kebutuhan konsumsi rumah tangga. |
| Menabung di bank | konsumen | Menyisihkan pendapatan untuk konsumsi masa depan. |
| Memproduksi barang di pabrik | produsen | Menghasilkan barang untuk dijual kepada konsumen. |
| Membayar upah karyawan | produsen | Balas jasa atas faktor produksi tenaga kerja. |
| Membuka usaha warung | produsen | Menjalankan kegiatan produksi dan penjualan barang. |
| Memungut pajak | pemerintah | Pajak adalah sumber pendapatan negara untuk membiayai pembangunan. |
| Membangun jalan raya | pemerintah | Pemerintah menyediakan fasilitas publik bagi masyarakat. |
| Membayar gaji pegawai negeri | pemerintah | Pemerintah bertindak sebagai pemberi kerja dan pengonsumsi. |

