import { Platform, NativeModules } from 'react-native';

type Lang = 'fr' | 'ar';

let currentLang: Lang = 'fr';

const deviceLang = Platform.OS === 'ios'
  ? NativeModules.SettingsManager?.settings?.AppleLocale?.slice(0, 2)
  : NativeModules.I18nManager?.localeIdentifier?.slice(0, 2);

if (deviceLang === 'ar') currentLang = 'ar';

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    'app.name': 'Club Africain',
    'tab.accueil': 'Accueil',
    'tab.matches': 'Matchs',
    'tab.news': 'Actus',
    'tab.community': 'Communauté',
    'tab.games': 'Jeux',
    'tab.wallet': 'Wallet',
    'home.live': 'En direct',
    'home.sections': 'Sections',
    'match.live': 'EN DIRECT',
    'match.upcoming': 'À VENIR',
    'match.finished': 'TERMINÉ',
    'match.all': 'Tous',
    'match.center': 'Match Center',
    'match.scores': 'Scores en direct',
    'news.title': 'Actualités',
    'news.all': 'Toutes',
    'news.empty': 'Aucune actualité',
    'community.title': 'Communauté',
    'community.subtitle': 'Les Clubistes parlent aux Clubistes',
    'community.placeholder': 'Partagez votre passion...',
    'games.title': 'Jeux',
    'wallet.title': 'Wallet',
    'missions.title': 'Missions',
    'notifications.title': 'Notifications',
    'profile.title': 'Profil',
    'donate.title': 'Caisse',
    'rewards.title': 'Récompenses',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.retry': 'Réessayer',
  },
  ar: {
    'app.name': 'النادي الإفريقي',
    'tab.accueil': 'الرئيسية',
    'tab.matches': 'المباريات',
    'tab.news': 'الأخبار',
    'tab.community': 'المجتمع',
    'tab.games': 'الألعاب',
    'tab.wallet': 'المحفظة',
    'home.live': 'مباشر',
    'home.sections': 'الأقسام',
    'match.live': 'مباشر',
    'match.upcoming': 'القادمة',
    'match.finished': 'المنتهية',
    'match.all': 'الكل',
    'match.center': 'مركز المباريات',
    'match.scores': 'النتائج المباشرة',
    'news.title': 'الأخبار',
    'news.all': 'الكل',
    'news.empty': 'لا توجد أخبار',
    'community.title': 'المجتمع',
    'community.subtitle': 'أبناء النادي يتحدثون',
    'community.placeholder': 'شارك شغفك...',
    'games.title': 'الألعاب',
    'wallet.title': 'المحفظة',
    'missions.title': 'المهام',
    'notifications.title': 'الإشعارات',
    'profile.title': 'الملف الشخصي',
    'donate.title': 'صندوق التبرعات',
    'rewards.title': 'المكافآت',
    'common.loading': 'جار التحميل...',
    'common.error': 'خطأ',
    'common.retry': 'إعادة المحاولة',
  },
};

export function t(key: string): string {
  return translations[currentLang][key] || key;
}

export function setLanguage(lang: Lang) {
  currentLang = lang;
}

export function getLanguage(): Lang {
  return currentLang;
}
