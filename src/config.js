// Replace demo details with the cosmetologist's verified information before launch.
export const studio = {
  name: 'Niya',
  address: '',
  instagramUrl: 'https://www.instagram.com/niya_cosmetolog/',
  googleMapsUrl: '',
  googleMapsEmbedUrl: '',
  bookingEndpoint: '', // Same-origin HTTPS POST endpoint; must validate, rate-limit and deliver requests.
  reviews: [], // Approved Google reviews: { name, text, rating, date, url }.
};
export const services = [
  { id: 'consult', category: 'consultation', name: {"ru": "Знакомство с кожей", "tr": "Cildinizle tanışma"}, description: {"ru": "Консультация, анализ потребностей и персональный план ухода.", "tr": "Görüşme, ihtiyaç analizi ve kişiye özel bakım planı."}, duration: 45, price: 600, keywords: ["знакомство", "консультация", "план", "tanışma", "danışma"], tag: { ru: "НАЧНЁМ ЗДЕСЬ", tr: "BURADAN BAŞLAYIN" } },
  { id: 'clean', category: 'care', name: {"ru": "Деликатное очищение", "tr": "Nazik temizleme"}, description: {"ru": "Профессиональное очищение и уход с учётом состояния кожи.", "tr": "Cildinizin durumuna uygun profesyonel temizleme ve bakım."}, duration: 75, price: 1400, keywords: ["очищение", "чистка", "поры", "temizleme", "gözenek"] },
  { id: 'hydrate', category: 'care', name: {"ru": "Ритуал увлажнения", "tr": "Nemlendirme ritüeli"}, description: {"ru": "Уход для ощущения комфорта, мягкости и свежести.", "tr": "Rahatlık, yumuşaklık ve ferahlık hissi için bakım."}, duration: 60, price: 1600, keywords: ["увлажнение", "сухость", "свежесть", "nem", "kuru"] },
  { id: 'peel', category: 'care', name: {"ru": "Мягкое обновление", "tr": "Nazik yenilenme"}, description: {"ru": "Поверхностный пилинг. Вид процедуры выбирается после консультации.", "tr": "Yüzeysel peeling. Uygulama türü görüşme sonrasında seçilir."}, duration: 45, price: 1200, keywords: ["пилинг", "обновление", "текстура", "peeling", "yenilenme"] },
  { id: 'massage', category: 'massage', name: {"ru": "Скульптурный массаж", "tr": "Şekillendirici yüz masajı"}, description: {"ru": "Ручной массаж лица и время для глубокого расслабления.", "tr": "Manuel yüz masajı ve derin rahatlama için zaman."}, duration: 60, price: 1300, keywords: ["массаж", "скульптурный", "расслабление", "masaj", "rahatlama"] },
  { id: 'ritual', category: 'massage', name: {"ru": "Полная пауза", "tr": "Kendinize tam bir mola"}, description: {"ru": "Массаж, увлажняющая маска и завершающий уход.", "tr": "Masaj, nemlendirici maske ve tamamlayıcı bakım."}, duration: 90, price: 2100, keywords: ["ритуал", "маска", "пауза", "массаж", "ritüel", "maske"] },
];
