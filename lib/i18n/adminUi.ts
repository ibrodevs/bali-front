export type AdminUiLocale = 'en' | 'ru' | 'id';

export const ADMIN_UI_LOCALES: { code: AdminUiLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'id', label: 'Indonesia' },
];

type TranslationPair = { ru: string; id: string };

const EXACT_TRANSLATIONS: Record<string, TranslationPair> = {
  'Overview': { ru: 'Обзор', id: 'Ringkasan' },
  'Bookings': { ru: 'Бронирования', id: 'Pesanan' },
  'Fleet': { ru: 'Парк', id: 'Armada' },
  'Calendar': { ru: 'Календарь', id: 'Kalender' },
  'CRM': { ru: 'CRM', id: 'CRM' },
  'Analytics': { ru: 'Аналитика', id: 'Analitik' },
  'Support': { ru: 'Поддержка', id: 'Dukungan' },
  'News': { ru: 'Новости', id: 'Berita' },
  'Add-ons': { ru: 'Допы', id: 'Add-on' },
  'Categories': { ru: 'Категории', id: 'Kategori' },
  'Locations': { ru: 'Локации', id: 'Lokasi' },
  'Site Content': { ru: 'Контент сайта', id: 'Konten situs' },
  'App Content': { ru: 'Контент приложения', id: 'Konten aplikasi' },
  'Users & Team': { ru: 'Пользователи и команда', id: 'Pengguna & tim' },
  'Promo Codes': { ru: 'Промокоды', id: 'Kode promo' },
  'Team Access': { ru: 'Доступ команды', id: 'Akses tim' },
  'Revenue': { ru: 'Выручка', id: 'Pendapatan' },
  'Security': { ru: 'Безопасность', id: 'Keamanan' },
  'Users': { ru: 'Пользователи', id: 'Pengguna' },
  'Login Events': { ru: 'События входа', id: 'Log masuk' },
  'Webhook Events': { ru: 'События webhook', id: 'Event webhook' },
  'Recent Bookings': { ru: 'Последние бронирования', id: 'Pesanan terbaru' },
  'Fleet Management': { ru: 'Управление парком', id: 'Manajemen armada' },
  'New Scooter': { ru: 'Новый скутер', id: 'Skuter baru' },
  'New scooter': { ru: 'Новый скутер', id: 'Skuter baru' },
  'Edit Scooter': { ru: 'Редактирование скутера', id: 'Edit skuter' },
  'Edit scooter': { ru: 'Редактировать скутер', id: 'Edit skuter' },
  'Occupancy Calendar': { ru: 'Календарь занятости', id: 'Kalender okupansi' },
  'Support Threads': { ru: 'Тикеты поддержки', id: 'Thread dukungan' },
  'Access & Webhooks': { ru: 'Доступ и вебхуки', id: 'Akses & webhook' },
  'Audit Trail': { ru: 'Журнал аудита', id: 'Jejak audit' },
  'Locations page': { ru: 'Страница локаций', id: 'Halaman lokasi' },
  'News articles': { ru: 'Статьи новостей', id: 'Artikel berita' },
  'Scooter pages': { ru: 'Страницы скутеров', id: 'Halaman skuter' },
  'FAQ section': { ru: 'Секция FAQ', id: 'Bagian FAQ' },
  'How It Works': { ru: 'Как это работает', id: 'Cara kerja' },
  'Home': { ru: 'Главная', id: 'Beranda' },
  'Catalog': { ru: 'Каталог', id: 'Katalog' },
  'Login': { ru: 'Вход', id: 'Masuk' },
  'Register': { ru: 'Регистрация', id: 'Daftar' },
  'English': { ru: 'Английский', id: 'Inggris' },
  'Русский': { ru: 'Русский', id: 'Rusia' },
  'Indonesia': { ru: 'Индонезийский', id: 'Indonesia' },
  'Deutsch': { ru: 'Немецкий', id: 'Jerman' },
  'Français': { ru: 'Французский', id: 'Prancis' },
  '中文': { ru: 'Китайский', id: 'Mandarin' },
  'Home header': { ru: 'Шапка главной', id: 'Header beranda' },
  'Catalog header': { ru: 'Шапка каталога', id: 'Header katalog' },
  'How It Works header': { ru: 'Шапка блока "Как это работает"', id: 'Header bagian cara kerja' },
  'Register header': { ru: 'Шапка регистрации', id: 'Header pendaftaran' },
  'Loading…': { ru: 'Загрузка…', id: 'Memuat…' },
  'Saving…': { ru: 'Сохранение…', id: 'Menyimpan…' },
  'Creating…': { ru: 'Создание…', id: 'Membuat…' },
  'Refreshing…': { ru: 'Обновление…', id: 'Menyegarkan…' },
  'Deleting…': { ru: 'Удаление…', id: 'Menghapus…' },
  'Reload': { ru: 'Обновить', id: 'Muat ulang' },
  'Reload preview': { ru: 'Обновить превью', id: 'Muat ulang preview' },
  'Refresh': { ru: 'Обновить', id: 'Segarkan' },
  'Close': { ru: 'Закрыть', id: 'Tutup' },
  'Edit': { ru: 'Редактировать', id: 'Edit' },
  'Delete': { ru: 'Удалить', id: 'Hapus' },
  'Cancel': { ru: 'Отмена', id: 'Batal' },
  'Save': { ru: 'Сохранить', id: 'Simpan' },
  'Reset': { ru: 'Сбросить', id: 'Reset' },
  'Reset field': { ru: 'Сбросить поле', id: 'Reset kolom' },
  'Save changes': { ru: 'Сохранить изменения', id: 'Simpan perubahan' },
  'Save all languages': { ru: 'Сохранить все языки', id: 'Simpan semua bahasa' },
  'Preview this language': { ru: 'Показать этот язык', id: 'Pratinjau bahasa ini' },
  'Open Analytics': { ru: 'Открыть аналитику', id: 'Buka analitik' },
  'Open Support': { ru: 'Открыть поддержку', id: 'Buka dukungan' },
  'Open App Content': { ru: 'Открыть контент приложения', id: 'Buka konten aplikasi' },
  'Open Users': { ru: 'Открыть пользователей', id: 'Buka pengguna' },
  'Open page': { ru: 'Открыть страницу', id: 'Buka halaman' },
  'Open profile': { ru: 'Открыть профиль', id: 'Buka profil' },
  'Open current file': { ru: 'Открыть текущий файл', id: 'Buka file saat ini' },
  'Open public page': { ru: 'Открыть публичную страницу', id: 'Buka halaman publik' },
  'View All': { ru: 'Смотреть все', id: 'Lihat semua' },
  '↗ View Website': { ru: '↗ Открыть сайт', id: '↗ Lihat situs' },
  'Add scooter': { ru: 'Добавить скутер', id: 'Tambah skuter' },
  'Add Scooter': { ru: 'Добавить скутер', id: 'Tambah skuter' },
  'Create scooter': { ru: 'Создать скутер', id: 'Buat skuter' },
  'Create new model': { ru: 'Создать новую модель', id: 'Buat model baru' },
  'Auto': { ru: 'Авто', id: 'Otomatis' },
  'Today': { ru: 'Сегодня', id: 'Hari ini' },
  'Create Zone': { ru: 'Создать зону', id: 'Buat zona' },
  'New Zone': { ru: 'Новая зона', id: 'Zona baru' },
  '+ Add Zone': { ru: '+ Добавить зону', id: '+ Tambah zona' },
  '+ Add add-on': { ru: '+ Добавить доп', id: '+ Tambah add-on' },
  '+ Add article': { ru: '+ Добавить статью', id: '+ Tambah artikel' },
  '+ Add category': { ru: '+ Добавить категорию', id: '+ Tambah kategori' },
  '+ Add': { ru: '+ Добавить', id: '+ Tambah' },
  'Create': { ru: 'Создать', id: 'Buat' },
  'Add member': { ru: 'Добавить участника', id: 'Tambah anggota' },
  'Delete image': { ru: 'Удалить фото', id: 'Hapus gambar' },
  'Upload new photos': { ru: 'Загрузить новые фото', id: 'Unggah foto baru' },
  'Upload gallery': { ru: 'Загрузить галерею', id: 'Unggah galeri' },
  'Add block': { ru: 'Добавить блок', id: 'Tambah blok' },
  'Delete?': { ru: 'Удалить?', id: 'Hapus?' },
  'Confirm': { ru: 'Подтвердить', id: 'Konfirmasi' },
  'Deactivate': { ru: 'Выключить', id: 'Nonaktifkan' },
  'Activate': { ru: 'Включить', id: 'Aktifkan' },
  'No': { ru: 'Нет', id: 'Tidak' },
  'Del': { ru: 'Удалить', id: 'Hapus' },
  'Active': { ru: 'Активно', id: 'Aktif' },
  'Active (visible to users)': { ru: 'Активно (видно пользователям)', id: 'Aktif (terlihat pengguna)' },
  'Active (visible to customers)': { ru: 'Активно (видно клиентам)', id: 'Aktif (terlihat pelanggan)' },
  'Inactive': { ru: 'Неактивно', id: 'Tidak aktif' },
  'Free': { ru: 'Бесплатно', id: 'Gratis' },
  'Paid': { ru: 'Платно', id: 'Berbayar' },
  'Published': { ru: 'Опубликовано', id: 'Dipublikasikan' },
  'custom': { ru: 'переопределено', id: 'kustom' },
  'default': { ru: 'по умолчанию', id: 'default' },
  'localized text': { ru: 'локализованный текст', id: 'teks terlokalisasi' },
  'shared across all languages': { ru: 'общее для всех языков', id: 'dipakai untuk semua bahasa' },
  'Click To Edit': { ru: 'Нажмите, чтобы редактировать', id: 'Klik untuk edit' },
  'Pages': { ru: 'Страницы', id: 'Halaman' },
  'Preview language': { ru: 'Язык превью', id: 'Bahasa pratinjau' },
  'Preview screen': { ru: 'Экран превью', id: 'Layar pratinjau' },
  'Selected Page': { ru: 'Выбранная страница', id: 'Halaman terpilih' },
  'Selected text': { ru: 'Выбранный текст', id: 'Teks yang dipilih' },
  'Quick Shortcuts': { ru: 'Быстрые переходы', id: 'Shortcut cepat' },
  'Previewed right now': { ru: 'Сейчас в превью', id: 'Sedang dipratinjau' },
  'Where this appears': { ru: 'Где это отображается', id: 'Di mana ini muncul' },
  'Live site preview': { ru: 'Живое превью сайта', id: 'Preview situs langsung' },
  'Real page inside admin': { ru: 'Реальная страница внутри админки', id: 'Halaman nyata di admin' },
  'Preview unavailable': { ru: 'Превью недоступно', id: 'Preview tidak tersedia' },
  'Text': { ru: 'Текст', id: 'Teks' },
  'Default value': { ru: 'Значение по умолчанию', id: 'Nilai default' },
  'Empty value': { ru: 'Пустое значение', id: 'Nilai kosong' },
  'Empty list': { ru: 'Пустой список', id: 'Daftar kosong' },
  'Question': { ru: 'Вопрос', id: 'Pertanyaan' },
  'Answer': { ru: 'Ответ', id: 'Jawaban' },
  'Question in English': { ru: 'Вопрос на английском', id: 'Pertanyaan dalam bahasa Inggris' },
  'Answer in English': { ru: 'Ответ на английском', id: 'Jawaban dalam bahasa Inggris' },
  'FAQ Management': { ru: 'Управление FAQ', id: 'Manajemen FAQ' },
  'New question': { ru: 'Новый вопрос', id: 'Pertanyaan baru' },
  'No FAQ items yet': { ru: 'FAQ пока пустой', id: 'Belum ada item FAQ' },
  'Add your first question above': { ru: 'Добавьте первый вопрос выше', id: 'Tambahkan pertanyaan pertama di atas' },
  'Code (ID)': { ru: 'Код (ID)', id: 'Kode (ID)' },
  'Sort order': { ru: 'Порядок сортировки', id: 'Urutan' },
  'Section permissions': { ru: 'Права на разделы', id: 'Izin bagian' },
  'Promo code': { ru: 'Промокод', id: 'Kode promo' },
  'Published date': { ru: 'Дата публикации', id: 'Tanggal publikasi' },
  'Start date': { ru: 'Дата начала', id: 'Tanggal mulai' },
  'End date': { ru: 'Дата окончания', id: 'Tanggal selesai' },
  'Min order, $': { ru: 'Мин. заказ, $', id: 'Min. order, $' },
  'Max discount, $ (optional)': { ru: 'Макс. скидка, $ (необязательно)', id: 'Diskon maks., $ (opsional)' },
  'Usage limit': { ru: 'Лимит использований', id: 'Batas penggunaan' },
  'Reserved by / note': { ru: 'Кем занято / заметка', id: 'Dipesan oleh / catatan' },
  'Access denied': { ru: 'Доступ запрещён', id: 'Akses ditolak' },
  'Admin privileges required.': { ru: 'Нужны права администратора.', id: 'Hak admin diperlukan.' },
  'Your account does not have admin privileges.': { ru: 'У вашего аккаунта нет прав администратора.', id: 'Akun Anda tidak memiliki hak admin.' },
  'Failed to save': { ru: 'Не удалось сохранить', id: 'Gagal menyimpan' },
  'Back to admin': { ru: 'Назад в админку', id: 'Kembali ke admin' },
  '← Admin': { ru: '← Админка', id: '← Admin' },
  '← Back to fleet': { ru: '← Назад к парку', id: '← Kembali ke armada' },
  'Back to fleet': { ru: 'Назад к парку', id: 'Kembali ke armada' },
  'Admin / Fleet': { ru: 'Админ / Парк', id: 'Admin / Armada' },
  'Admin / Fleet / Edit': { ru: 'Админ / Парк / Редактирование', id: 'Admin / Armada / Edit' },
  'ADMIN PANEL': { ru: 'АДМИН ПАНЕЛЬ', id: 'PANEL ADMIN' },
  'Model': { ru: 'Модель', id: 'Model' },
  'Model Details': { ru: 'Данные модели', id: 'Detail model' },
  'Model info': { ru: 'Информация о модели', id: 'Info model' },
  'Scooter Details': { ru: 'Данные скутера', id: 'Detail skuter' },
  'Scooter Card': { ru: 'Карточка скутера', id: 'Kartu skuter' },
  'Characteristics': { ru: 'Характеристики', id: 'Karakteristik' },
  'Vehicle Performance': { ru: 'Параметры транспорта', id: 'Performa kendaraan' },
  'Gallery': { ru: 'Галерея', id: 'Galeri' },
  'Photos': { ru: 'Фотографии', id: 'Foto' },
  'Preview': { ru: 'Превью', id: 'Pratinjau' },
  'Vehicle model': { ru: 'Модель транспорта', id: 'Model kendaraan' },
  'Select model': { ru: 'Выберите модель', id: 'Pilih model' },
  'Select category': { ru: 'Выберите категорию', id: 'Pilih kategori' },
  'Use existing model': { ru: 'Использовать существующую модель', id: 'Gunakan model yang ada' },
  'Category': { ru: 'Категория', id: 'Kategori' },
  'Title': { ru: 'Название', id: 'Judul' },
  'SKU (optional)': { ru: 'SKU (необязательно)', id: 'SKU (opsional)' },
  'SKU': { ru: 'SKU', id: 'SKU' },
  'Slug': { ru: 'Slug', id: 'Slug' },
  'Color': { ru: 'Цвет', id: 'Warna' },
  'Price / day': { ru: 'Цена / день', id: 'Harga / hari' },
  'Mileage': { ru: 'Пробег', id: 'Jarak tempuh' },
  'Status': { ru: 'Статус', id: 'Status' },
  'Feature on website homepage': { ru: 'Показывать на главной сайта', id: 'Tampilkan di beranda situs' },
  'Show as featured on website': { ru: 'Показывать как избранный на сайте', id: 'Tampilkan sebagai unggulan di situs' },
  'Featured on website': { ru: 'Избранное на сайте', id: 'Unggulan di situs' },
  'Transmission': { ru: 'Трансмиссия', id: 'Transmisi' },
  'Engine': { ru: 'Двигатель', id: 'Mesin' },
  'Year': { ru: 'Год', id: 'Tahun' },
  'Helmets': { ru: 'Шлемы', id: 'Helm' },
  'Type': { ru: 'Тип', id: 'Tipe' },
  'Fuel (L/100km)': { ru: 'Топливо (л/100км)', id: 'Bahan bakar (L/100km)' },
  'Engine (cc)': { ru: 'Двигатель (cc)', id: 'Mesin (cc)' },
  'Engine cc': { ru: 'Объём двигателя', id: 'CC mesin' },
  'Fuel': { ru: 'Топливо', id: 'Bahan bakar' },
  'Trunk / Storage': { ru: 'Багажник / хранилище', id: 'Bagasi / penyimpanan' },
  'Trunk / storage': { ru: 'Багажник / хранилище', id: 'Bagasi / penyimpanan' },
  'Vehicle title': { ru: 'Название скутера', id: 'Judul kendaraan' },
  'Main photo': { ru: 'Главное фото', id: 'Foto utama' },
  'Description (English fallback)': { ru: 'Описание (английский по умолчанию)', id: 'Deskripsi (fallback bahasa Inggris)' },
  'Rental Terms (English fallback)': { ru: 'Условия аренды (английский по умолчанию)', id: 'Syarat sewa (fallback bahasa Inggris)' },
  'New photos are appended to the gallery.': { ru: 'Новые фото добавляются в конец галереи.', id: 'Foto baru ditambahkan ke galeri.' },
  'The selected main photo will be used as the primary image on the site.': { ru: 'Выбранное главное фото будет основным изображением на сайте.', id: 'Foto utama yang dipilih akan menjadi gambar utama di situs.' },
  'Detailed description': { ru: 'Подробное описание', id: 'Deskripsi lengkap' },
  'Rental terms': { ru: 'Условия аренды', id: 'Syarat sewa' },
  'Existing model': { ru: 'Существующая модель', id: 'Model yang sudah ada' },
  'Brand': { ru: 'Бренд', id: 'Merek' },
  'Model name': { ru: 'Название модели', id: 'Nama model' },
  'Use available to show on the public catalog immediately.': { ru: 'Выберите available, чтобы сразу показывать скутер в публичном каталоге.', id: 'Pilih available agar skuter langsung tampil di katalog publik.' },
  'No scooters found.': { ru: 'Скутеры не найдены.', id: 'Skuter tidak ditemukan.' },
  'No photos yet. Upload at least one to show on the site.': { ru: 'Фото пока нет. Загрузите хотя бы одно, чтобы оно отображалось на сайте.', id: 'Belum ada foto. Unggah setidaknya satu agar tampil di situs.' },
  'Existing photos': { ru: 'Текущие фото', id: 'Foto yang ada' },
  'Add one or more photos for the site gallery.': { ru: 'Добавьте одну или несколько фотографий для галереи сайта.', id: 'Tambahkan satu atau beberapa foto untuk galeri situs.' },
  'Title pending': { ru: 'Название ещё не задано', id: 'Judul belum diisi' },
  'Description will come from the selected model.': { ru: 'Описание будет взято из выбранной модели.', id: 'Deskripsi akan diambil dari model yang dipilih.' },
  'Detailed description will appear here.': { ru: 'Здесь появится подробное описание.', id: 'Deskripsi lengkap akan muncul di sini.' },
  'Save and publish': { ru: 'Сохранить и опубликовать', id: 'Simpan dan publikasikan' },
  'Saved content reaches the website from the same API the storefront already uses:': { ru: 'Сохранённый контент попадает на сайт через тот же API, который уже использует витрина:', id: 'Konten tersimpan masuk ke situs melalui API yang sama yang dipakai storefront:' },
  'description and rental terms from vehicle model,': { ru: 'описание и условия аренды из модели транспорта,', id: 'deskripsi dan syarat sewa dari model kendaraan,' },
  'photos from vehicle gallery,': { ru: 'фотографии из галереи транспорта,', id: 'foto dari galeri kendaraan,' },
  'price and status from the scooter card.': { ru: 'цену и статус из карточки скутера.', id: 'harga dan status dari kartu skuter.' },
  'FAQ': { ru: 'FAQ', id: 'FAQ' },
  'Questions and answers on all languages.': { ru: 'Вопросы и ответы на всех языках.', id: 'Pertanyaan dan jawaban di semua bahasa.' },
  'Choose scooter': { ru: 'Выберите скутер', id: 'Pilih skuter' },
  'Guest name, maintenance, external booking...': { ru: 'Имя гостя, обслуживание, внешнее бронирование...', id: 'Nama tamu, servis, booking eksternal...' },
  'Visitors': { ru: 'Посетители', id: 'Pengunjung' },
  'Analytics events': { ru: 'События аналитики', id: 'Event analitik' },
  'Active Bookings': { ru: 'Активные бронирования', id: 'Pesanan aktif' },
  'Current pipeline': { ru: 'Текущий поток', id: 'Pipeline saat ini' },
  'Fleet Utilization': { ru: 'Загрузка парка', id: 'Pemakaian armada' },
  'Live backend analytics': { ru: 'Живая аналитика с бэкенда', id: 'Analitik backend langsung' },
  'Live orders from backend': { ru: 'Живые заказы с бэкенда', id: 'Pesanan live dari backend' },
  'Backend analytics event steps': { ru: 'Шаги событий аналитики бэкенда', id: 'Langkah event analitik backend' },
  'Based on booking delivery addresses': { ru: 'На основе адресов доставки из бронирований', id: 'Berdasarkan alamat pengiriman booking' },
  'Revenue contribution by scooter': { ru: 'Вклад выручки по скутерам', id: 'Kontribusi pendapatan per skuter' },
  'No bookings yet.': { ru: 'Бронирований пока нет.', id: 'Belum ada pesanan.' },
  'No audit events yet.': { ru: 'Аудит-событий пока нет.', id: 'Belum ada event audit.' },
  'No security events yet.': { ru: 'Событий безопасности пока нет.', id: 'Belum ada event keamanan.' },
  'No booking revenue data yet.': { ru: 'Данных по выручке пока нет.', id: 'Belum ada data pendapatan booking.' },
  'No funnel data yet.': { ru: 'Данных воронки пока нет.', id: 'Belum ada data funnel.' },
  'No delivery data yet.': { ru: 'Данных по доставке пока нет.', id: 'Belum ada data pengiriman.' },
  'No messages yet': { ru: 'Сообщений пока нет', id: 'Belum ada pesan' },
  'No messages in this thread.': { ru: 'В этом тикете пока нет сообщений.', id: 'Belum ada pesan di thread ini.' },
  'No support threads available.': { ru: 'Нет доступных тикетов поддержки.', id: 'Tidak ada thread dukungan.' },
  'Support Thread': { ru: 'Тикет поддержки', id: 'Thread dukungan' },
  'Close Thread': { ru: 'Закрыть тикет', id: 'Tutup thread' },
  'Type a message...': { ru: 'Введите сообщение...', id: 'Tulis pesan...' },
  'Recent admin activity': { ru: 'Недавняя активность админов', id: 'Aktivitas admin terbaru' },
  'Last 12 months from paid bookings': { ru: 'Последние 12 месяцев по оплаченным бронированиям', id: '12 bulan terakhir dari booking berbayar' },
  'Manage delivery zones and translations': { ru: 'Управление зонами доставки и переводами', id: 'Kelola zona pengiriman dan terjemahan' },
  'Delivery Zones': { ru: 'Зоны доставки', id: 'Zona pengiriman' },
  'Delivery zones, translated zone names and location section copy.': { ru: 'Зоны доставки, переведённые названия зон и тексты раздела локаций.', id: 'Zona pengiriman, nama zona terjemahan, dan copy bagian lokasi.' },
  'Add, edit, or delete delivery zones. Zone names can be translated per language.': { ru: 'Добавляйте, редактируйте и удаляйте зоны доставки. Названия зон можно переводить по языкам.', id: 'Tambah, edit, atau hapus zona pengiriman. Nama zona bisa diterjemahkan per bahasa.' },
  'Zone name (default)': { ru: 'Название зоны (по умолчанию)', id: 'Nama zona (default)' },
  'Zone name': { ru: 'Название зоны', id: 'Nama zona' },
  'Free delivery': { ru: 'Бесплатная доставка', id: 'Gratis ongkir' },
  'Show on site': { ru: 'Показывать на сайте', id: 'Tampilkan di situs' },
  'Translations (optional)': { ru: 'Переводы (необязательно)', id: 'Terjemahan (opsional)' },
  'Name Translations': { ru: 'Переводы названия', id: 'Terjemahan nama' },
  'No zones yet. Click "+ Add Zone" to create the first one.': { ru: 'Зон пока нет. Нажмите "+ Добавить зону", чтобы создать первую.', id: 'Belum ada zona. Klik "+ Tambah zona" untuk membuat yang pertama.' },
  'Add-ons Management': { ru: 'Управление допами', id: 'Manajemen add-on' },
  'Manage add-ons with multilingual names and descriptions': { ru: 'Управляйте допами с многоязычными названиями и описаниями', id: 'Kelola add-on dengan nama dan deskripsi multibahasa' },
  'No add-ons yet.': { ru: 'Допов пока нет.', id: 'Belum ada add-on.' },
  'No categories yet.': { ru: 'Категорий пока нет.', id: 'Belum ada kategori.' },
  'No articles yet. Add the first one.': { ru: 'Статей пока нет. Добавьте первую.', id: 'Belum ada artikel. Tambahkan yang pertama.' },
  'No promo codes yet. Create the first one.': { ru: 'Промокодов пока нет. Создайте первый.', id: 'Belum ada kode promo. Buat yang pertama.' },
  'New Add-on': { ru: 'Новый доп', id: 'Add-on baru' },
  'New Category': { ru: 'Новая категория', id: 'Kategori baru' },
  'New code': { ru: 'Новый код', id: 'Kode baru' },
  'Name (EN base)': { ru: 'Название (EN база)', id: 'Nama (basis EN)' },
  'Category name (EN base)': { ru: 'Название категории (EN база)', id: 'Nama kategori (basis EN)' },
  'Price (USD)': { ru: 'Цена (USD)', id: 'Harga (USD)' },
  'Price Type': { ru: 'Тип цены', id: 'Jenis harga' },
  'Per day': { ru: 'За день', id: 'Per hari' },
  'Fixed': { ru: 'Фиксированная', id: 'Tetap' },
  'Fixed ($)': { ru: 'Фиксировано ($)', id: 'Tetap ($)' },
  'Per trip': { ru: 'За поездку', id: 'Per perjalanan' },
  'Percent (%)': { ru: 'Процент (%)', id: 'Persen (%)' },
  'Description (EN base)': { ru: 'Описание (EN база)', id: 'Deskripsi (basis EN)' },
  'Translations': { ru: 'Переводы', id: 'Terjemahan' },
  'Section label': { ru: 'Метка секции', id: 'Label bagian' },
  'Button label': { ru: 'Текст кнопки', id: 'Label tombol' },
  'Input placeholder': { ru: 'Плейсхолдер поля', id: 'Placeholder input' },
  'Helper text': { ru: 'Подсказка', id: 'Teks bantuan' },
  'Review content': { ru: 'Текст отзыва', id: 'Konten ulasan' },
  'Main heading': { ru: 'Главный заголовок', id: 'Judul utama' },
  'Supporting text': { ru: 'Поддерживающий текст', id: 'Teks pendukung' },
  'Text content': { ru: 'Текстовый контент', id: 'Konten teks' },
  'Structured content block': { ru: 'Структурированный блок контента', id: 'Blok konten terstruktur' },
  'Image asset': { ru: 'Изображение', id: 'Aset gambar' },
  'Video asset': { ru: 'Видео', id: 'Aset video' },
  'Downloadable file': { ru: 'Файл для скачивания', id: 'File unduhan' },
  'Add admins and staff, then assign exactly which parts of the admin panel they can access.': { ru: 'Добавляйте админов и сотрудников и точно настраивайте, какие разделы админки им доступны.', id: 'Tambah admin dan staf lalu atur bagian admin panel mana saja yang bisa mereka akses.' },
  'No admin or staff users yet.': { ru: 'Пока нет администраторов или сотрудников.', id: 'Belum ada admin atau staf.' },
  'Your account can view the team list, but only admins with the Team Access permission can create or edit team members.': { ru: 'Ваш аккаунт может видеть список команды, но создавать и редактировать участников могут только админы с правом Team Access.', id: 'Akun Anda dapat melihat daftar tim, tetapi hanya admin dengan izin Team Access yang dapat membuat atau mengedit anggota tim.' },
  'Last': { ru: 'Последнее', id: 'Terakhir' },
  'LTV': { ru: 'LTV', id: 'LTV' },
  'Customer': { ru: 'Клиент', id: 'Pelanggan' },
  'Email / Phone': { ru: 'Email / Телефон', id: 'Email / Telepon' },
  'Segment': { ru: 'Сегмент', id: 'Segmen' },
  'Notes': { ru: 'Заметки', id: 'Catatan' },
  'Last Booking': { ru: 'Последнее бронирование', id: 'Booking terakhir' },
  'Customer profiles, segments and booking history': { ru: 'Профили клиентов, сегменты и история бронирований', id: 'Profil pelanggan, segmen, dan riwayat booking' },
  'Choose a page, click text on the site preview, and edit that copy across languages.': { ru: 'Выберите страницу, нажмите на текст в превью сайта и редактируйте этот контент сразу по языкам.', id: 'Pilih halaman, klik teks di preview situs, lalu edit copy itu untuk semua bahasa.' },
  'This opens a dedicated content workspace filtered only to the mobile app text keys and all supported languages.': { ru: 'Это открывает отдельное рабочее пространство контента только для текстовых ключей мобильного приложения и всех поддерживаемых языков.', id: 'Ini membuka workspace konten khusus yang difilter hanya ke key teks aplikasi mobile dan semua bahasa yang didukung.' },
  'Edit onboarding, home, booking, profile and support texts for the mobile app.': { ru: 'Редактируйте тексты онбординга, главной, бронирования, профиля и поддержки для мобильного приложения.', id: 'Edit teks onboarding, beranda, booking, profil, dan dukungan untuk aplikasi mobile.' },
  'Add admins and staff from a dedicated screen instead of the overview.': { ru: 'Добавляйте админов и сотрудников на отдельном экране, а не через обзор.', id: 'Tambah admin dan staf dari layar khusus, bukan dari ringkasan.' },
  'Choose a model for this scooter.': { ru: 'Выберите модель для этого скутера.', id: 'Pilih model untuk skuter ini.' },
  'Fill in title, slug and price.': { ru: 'Заполните название, slug и цену.', id: 'Isi judul, slug, dan harga.' },
  'Changes saved successfully.': { ru: 'Изменения успешно сохранены.', id: 'Perubahan berhasil disimpan.' },
  'Unable to load scooter data': { ru: 'Не удалось загрузить данные скутера', id: 'Tidak dapat memuat data skuter' },
  'Unable to save changes': { ru: 'Не удалось сохранить изменения', id: 'Tidak dapat menyimpan perubahan' },
  'Failed to delete image': { ru: 'Не удалось удалить изображение', id: 'Gagal menghapus gambar' },
  'Fill in all model fields including description and rental terms.': { ru: 'Заполните все поля модели, включая описание и условия аренды.', id: 'Isi semua field model termasuk deskripsi dan syarat sewa.' },
  'Choose an existing model or create a new one.': { ru: 'Выберите существующую модель или создайте новую.', id: 'Pilih model yang ada atau buat yang baru.' },
  'Fill in scooter title, slug and price.': { ru: 'Заполните название скутера, slug и цену.', id: 'Isi judul skuter, slug, dan harga.' },
  'Scooter created and published to the site.': { ru: 'Скутер создан и опубликован на сайте.', id: 'Skuter berhasil dibuat dan dipublikasikan di situs.' },
  'Unable to save scooter': { ru: 'Не удалось сохранить скутер', id: 'Tidak dapat menyimpan skuter' },
  'No image selected yet.': { ru: 'Изображение ещё не выбрано.', id: 'Belum ada gambar yang dipilih.' },
  'No video selected yet.': { ru: 'Видео ещё не выбрано.', id: 'Belum ada video yang dipilih.' },
  'No file selected yet.': { ru: 'Файл ещё не выбран.', id: 'Belum ada file yang dipilih.' },
  'No English translation': { ru: 'Нет английского перевода', id: 'Tidak ada terjemahan bahasa Inggris' },
  'e.g. delivery_time': { ru: 'например: delivery_time', id: 'misalnya: delivery_time' },
  'Go to login': { ru: 'Перейти ко входу', id: 'Ke halaman login' },
  'Sign out': { ru: 'Выйти', id: 'Keluar' },
  'Guest': { ru: 'Гость', id: 'Tamu' },
  'Scooter': { ru: 'Скутер', id: 'Skuter' },
  'Unknown': { ru: 'Неизвестно', id: 'Tidak diketahui' },
  'System': { ru: 'Система', id: 'Sistem' },
  'Phone not provided': { ru: 'Телефон не указан', id: 'Telepon tidak diisi' },
  'Delivery address not provided': { ru: 'Адрес доставки не указан', id: 'Alamat pengiriman tidak diisi' },
  'Blocked from admin panel': { ru: 'Заблокировано из админки', id: 'Diblokir dari panel admin' },
  'Pick a conversation to start.': { ru: 'Выберите диалог, чтобы начать.', id: 'Pilih percakapan untuk memulai.' },
  'Untitled thread': { ru: 'Тикет без названия', id: 'Thread tanpa judul' },
  'Menu': { ru: 'Меню', id: 'Menu' },
  'Required fields: model, title, slug, SKU, price.': { ru: 'Обязательные поля: модель, название, slug, SKU, цена.', id: 'Field wajib: model, judul, slug, SKU, harga.' },
  'Fill in the fields below': { ru: 'Заполните поля ниже', id: 'Isi field di bawah' },
  'Actual articles and images for the news page.': { ru: 'Реальные статьи и изображения для страницы новостей.', id: 'Artikel dan gambar nyata untuk halaman berita.' },
  'Titles, specs, gallery, translations and photos of each bike.': { ru: 'Названия, характеристики, галерея, переводы и фото каждого байка.', id: 'Judul, spesifikasi, galeri, terjemahan, dan foto tiap motor.' },
  'Choose text directly on the site': { ru: 'Выбирайте текст прямо на сайте', id: 'Pilih teks langsung di situs' },
  'Invalid JSON. Fix the syntax to preview this block.': { ru: 'Некорректный JSON. Исправьте синтаксис, чтобы увидеть превью этого блока.', id: 'JSON tidak valid. Perbaiki sintaksnya untuk melihat preview blok ini.' },
  'Loading manual blocks…': { ru: 'Загрузка ручных блокировок…', id: 'Memuat blok manual…' },
  'Manual block': { ru: 'Ручной блок', id: 'Blok manual' },
  'available': { ru: 'доступен', id: 'tersedia' },
  'rented': { ru: 'в аренде', id: 'disewa' },
  'maintenance': { ru: 'обслуживание', id: 'perawatan' },
  'inactive': { ru: 'неактивен', id: 'nonaktif' },
  'created': { ru: 'создано', id: 'dibuat' },
  'confirmed': { ru: 'подтверждено', id: 'dikonfirmasi' },
  'active': { ru: 'активно', id: 'aktif' },
  'completed': { ru: 'завершено', id: 'selesai' },
  'cancelled': { ru: 'отменено', id: 'dibatalkan' },
  'paid': { ru: 'оплачено', id: 'dibayar' },
  'pending': { ru: 'в ожидании', id: 'menunggu' },
  'failed': { ru: 'ошибка', id: 'gagal' },
  'refunded': { ru: 'возврат', id: 'refund' },
  'open': { ru: 'открыто', id: 'terbuka' },
  'closed': { ru: 'закрыто', id: 'tertutup' },
  'staff': { ru: 'сотрудник', id: 'staf' },
  'manager': { ru: 'менеджер', id: 'manajer' },
  'admin': { ru: 'админ', id: 'admin' },
};

const LANGUAGE_LABELS: Record<string, TranslationPair> = {
  English: { ru: 'английском', id: 'bahasa Inggris' },
  'Русский': { ru: 'русском', id: 'bahasa Rusia' },
  Indonesia: { ru: 'индонезийском', id: 'bahasa Indonesia' },
  Deutsch: { ru: 'немецком', id: 'bahasa Jerman' },
  Français: { ru: 'французском', id: 'bahasa Prancis' },
  '中文': { ru: 'китайском', id: 'bahasa Mandarin' },
};

type DynamicRule = {
  pattern: RegExp;
  translate: (match: RegExpExecArray, locale: Exclude<AdminUiLocale, 'en'>) => string;
};

const DYNAMIC_TRANSLATIONS: DynamicRule[] = [
  {
    pattern: /^([A-Za-z][A-Za-z /()&-]+):$/,
    translate: (match, locale) => {
      const base = EXACT_TRANSLATIONS[match[1]];
      return base ? `${base[locale]}:` : match[0];
    },
  },
  {
    pattern: /^(\d+) question(?:s)? · 6 languages$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} вопросов · 6 языков`
      : `${match[1]} pertanyaan · 6 bahasa`,
  },
  {
    pattern: /^(\d+)\/(\d+) filled$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]}/${match[2]} заполнено`
      : `${match[1]}/${match[2]} terisi`,
  },
  {
    pattern: /^(\d+)\/(\d+) languages filled$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]}/${match[2]} языков заполнено`
      : `${match[1]}/${match[2]} bahasa terisi`,
  },
  {
    pattern: /^(\d+) langs$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} яз.`
      : `${match[1]} bahasa`,
  },
  {
    pattern: /^Name in (.+)$/,
    translate: (match, locale) => {
      const label = LANGUAGE_LABELS[match[1]]?.[locale] || match[1];
      return locale === 'ru' ? `Название на ${label}` : `Nama dalam ${label}`;
    },
  },
  {
    pattern: /^Question in (.+)$/,
    translate: (match, locale) => {
      const label = LANGUAGE_LABELS[match[1]]?.[locale] || match[1];
      return locale === 'ru' ? `Вопрос на ${label}` : `Pertanyaan dalam ${label}`;
    },
  },
  {
    pattern: /^Answer in (.+)$/,
    translate: (match, locale) => {
      const label = LANGUAGE_LABELS[match[1]]?.[locale] || match[1];
      return locale === 'ru' ? `Ответ на ${label}` : `Jawaban dalam ${label}`;
    },
  },
  {
    pattern: /^Addon name in (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Название допа на ${match[1].toUpperCase()}`
      : `Nama add-on dalam ${match[1].toUpperCase()}`,
  },
  {
    pattern: /^Description in (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Описание на ${match[1].toUpperCase()}`
      : `Deskripsi dalam ${match[1].toUpperCase()}`,
  },
  {
    pattern: /^Title in (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Заголовок на ${match[1].toUpperCase()}`
      : `Judul dalam ${match[1].toUpperCase()}`,
  },
  {
    pattern: /^(\d+) vehicles from backend$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} единиц техники из бэкенда`
      : `${match[1]} kendaraan dari backend`,
  },
  {
    pattern: /^(\d+) bookings loaded from backend$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} бронирований загружено из бэкенда`
      : `${match[1]} pesanan dimuat dari backend`,
  },
  {
    pattern: /^Preview: ([A-Z]+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Превью: ${match[1]}`
      : `Pratinjau: ${match[1]}`,
  },
  {
    pattern: /^Preview in ([A-Z]+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Превью на ${match[1]}`
      : `Pratinjau dalam ${match[1]}`,
  },
  {
    pattern: /^(\d+) clickable content fields$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} кликабельных полей контента`
      : `${match[1]} field konten yang bisa diklik`,
  },
  {
    pattern: /^(\d+) total content entries$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} всего контентных полей`
      : `${match[1]} total entri konten`,
  },
  {
    pattern: /^(\d+) clickable$/,
    translate: (match, locale) => locale === 'ru'
      ? `${match[1]} кликабельно`
      : `${match[1]} bisa diklik`,
  },
  {
    pattern: /^Code: (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Код: ${match[1]}`
      : `Kode: ${match[1]}`,
  },
  {
    pattern: /^Edit: (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Редактирование: ${match[1]}`
      : `Edit: ${match[1]}`,
  },
  {
    pattern: /^Dropoff: (.+)$/,
    translate: (match, locale) => locale === 'ru'
      ? `Отвал: ${match[1]}`
      : `Dropoff: ${match[1]}`,
  },
  {
    pattern: /^Used (\d+) \/ (\d+) times$/,
    translate: (match, locale) => locale === 'ru'
      ? `Использовано ${match[1]} / ${match[2]} раз`
      : `Dipakai ${match[1]} / ${match[2]} kali`,
  },
  {
    pattern: /^Leave empty to use the default "(.+)"$/,
    translate: (match, locale) => locale === 'ru'
      ? `Оставьте пустым, чтобы использовать значение по умолчанию "${match[1]}"`
      : `Kosongkan untuk memakai nilai default "${match[1]}"`,
  },
  {
    pattern: /^This language is shown in the live preview\.$/,
    translate: (_match, locale) => locale === 'ru'
      ? 'Этот язык сейчас показан в живом превью.'
      : 'Bahasa ini sedang ditampilkan pada preview live.',
  },
  {
    pattern: /^Edit here even if another language is open in preview\.$/,
    translate: (_match, locale) => locale === 'ru'
      ? 'Редактируйте здесь, даже если в превью открыт другой язык.'
      : 'Edit di sini meskipun bahasa lain sedang terbuka di preview.',
  },
];

export function translateAdminUiText(source: string, locale: AdminUiLocale): string {
  if (locale === 'en') return source;

  const exact = EXACT_TRANSLATIONS[source];
  if (exact) {
    return exact[locale];
  }

  for (const rule of DYNAMIC_TRANSLATIONS) {
    const match = rule.pattern.exec(source);
    if (match) {
      return rule.translate(match, locale);
    }
  }

  return source;
}
