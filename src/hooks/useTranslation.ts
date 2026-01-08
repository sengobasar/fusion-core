import { useState, useEffect } from "react";
import { translations } from "../i18n/dictionary";
import type { Language } from "../i18n/dictionary";

type TranslationKey = keyof typeof translations["en"];

export function useTranslation() {
    const [lang, setLang] = useState<Language>(() => {
        return (localStorage.getItem("app_lang") as Language) || "en";
    });

    useEffect(() => {
        localStorage.setItem("app_lang", lang);
    }, [lang]);

    function t(key: TranslationKey): string {
        return translations[lang][key] || key;
    }

    return { t, lang, setLang };
}
