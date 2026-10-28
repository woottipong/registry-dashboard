"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type Language = "en" | "th"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.overview": "Overview",
    "nav.repositories": "Repositories",
    "nav.settings": "Registry Settings",
    "nav.main": "Main",
    "nav.shortcuts": "Registry shortcuts",
    "nav.addRegistry": "Add registry",
    "nav.noRegistries": "No registries connected",
    "nav.systemLive": "System Operational",
    "nav.default": "Default",
    "nav.version": "Version",

    // Dashboard
    "dashboard.title": "Overview",
    "dashboard.subtitle": "Container registries, repositories, and tag telemetry.",
    "dashboard.addRegistry": "Add registry",
    "dashboard.browseRepos": "Browse repositories",
    "dashboard.registries": "Registries",
    "dashboard.live": "Live",
    "dashboard.standby": "Standby",
    "dashboard.repositories": "Repositories",
    "dashboard.indexed": "indexed",
    "dashboard.tags": "Tags",
    "dashboard.providers": "Providers",
    "dashboard.operational": "100% operational",
    "dashboard.inventoryTitle": "Registry inventory",
    "dashboard.inventorySubtitle": "Repository volume by connected endpoint",
    "dashboard.manage": "Manage",
    "dashboard.repoShare": "Repository share",
    "dashboard.total": "total",
    "dashboard.topReposTitle": "Top repositories",
    "dashboard.topReposSubtitle": "Highest tag volume across connected registries",
    "dashboard.viewAll": "View all",
    "dashboard.recentActivityTitle": "Recent activity",
    "dashboard.liveOperations": "Live operations stream",
    "dashboard.noActivity": "No recent activity recorded yet. Activity will appear here when images or registries are accessed.",

    // Repositories
    "repos.title": "Repositories",
    "repos.subtitle": "Choose a registry and namespace to browse repositories.",
    "repos.browseNamespace": "Browse repositories in the selected namespace.",
    "repos.namespaces": "Namespaces",
    "repos.searchPlaceholder": "Search repositories",
    "repos.allRegistries": "All registries",
    "repos.noRegistries": "No registry connected",
    "repos.noRegistriesDesc": "Connect a Docker registry to start browsing your container images.",

    // General
    "common.clear": "Clear",
    "common.test": "Test",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.save": "Save Changes",
    "common.default": "Default",
  },
  th: {
    // Navigation
    "nav.overview": "ภาพรวม",
    "nav.repositories": "คลังรูปภาพ",
    "nav.settings": "ตั้งค่า Registry",
    "nav.main": "เมนูหลัก",
    "nav.shortcuts": "ทางลัด Registry",
    "nav.addRegistry": "เพิ่ม Registry",
    "nav.noRegistries": "ยังไม่มี Registry ที่เชื่อมต่อ",
    "nav.systemLive": "ระบบพร้อมใช้งาน",
    "nav.default": "ค่าเริ่มต้น",
    "nav.version": "เวอร์ชัน",

    // Dashboard
    "dashboard.title": "ภาพรวม",
    "dashboard.subtitle": "ข้อมูลภาพรวมและการจัดเก็บคอนเทนเนอร์อิมเมจ",
    "dashboard.addRegistry": "เพิ่ม Registry",
    "dashboard.browseRepos": "สำรวจคลังรูปภาพ",
    "dashboard.registries": "Registries",
    "dashboard.live": "ทำงานอยู่",
    "dashboard.standby": "สแตนด์บาย",
    "dashboard.repositories": "คลังรูปภาพ",
    "dashboard.indexed": "บันทึกแล้ว",
    "dashboard.tags": "แท็กเวอร์ชัน",
    "dashboard.providers": "ผู้ให้บริการ",
    "dashboard.operational": "พร้อมใช้งาน 100%",
    "dashboard.inventoryTitle": "รายการ Registry",
    "dashboard.inventorySubtitle": "ปริมาณคลังรูปภาพตามการเชื่อมต่อ",
    "dashboard.manage": "จัดการ",
    "dashboard.repoShare": "สัดส่วนคลังรูปภาพ",
    "dashboard.total": "ทั้งหมด",
    "dashboard.topReposTitle": "คลังยอดนิยม",
    "dashboard.topReposSubtitle": "คลังที่มีจำนวนแท็กสูงสุดในระบบ",
    "dashboard.viewAll": "ดูทั้งหมด",
    "dashboard.recentActivityTitle": "กิจกรรมล่าสุด",
    "dashboard.liveOperations": "สตรีมเหตุการณ์แบบสด",
    "dashboard.noActivity": "ยังไม่มีประวัติกิจกรรมล่าสุด กิจกรรมจะแสดงที่นี่เมื่อมีการใช้งานอิมเมจหรือ Registry",

    // Repositories
    "repos.title": "คลังรูปภาพ",
    "repos.subtitle": "เลือก Registry และเนมสเปซเพื่อสำรวจอิมเมจ",
    "repos.browseNamespace": "สำรวจคลังรูปภาพในเนมสเปซที่เลือก",
    "repos.namespaces": "เนมสเปซ",
    "repos.searchPlaceholder": "ค้นหาคลังรูปภาพ...",
    "repos.allRegistries": "Registry ทั้งหมด",
    "repos.noRegistries": "ยังไม่ได้เชื่อมต่อ Registry",
    "repos.noRegistriesDesc": "เชื่อมต่อ Docker Registry เพื่อเริ่มจัดการคอนเทนเนอร์อิมเมจ",

    // General
    "common.clear": "ล้าง",
    "common.test": "ทดสอบ",
    "common.delete": "ลบ",
    "common.cancel": "ยกเลิก",
    "common.save": "บันทึกการเปลี่ยนแปลง",
    "common.default": "ค่าเริ่มต้น",
  },
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback ?? key,
})

const STORAGE_KEY = "registry_dashboard_lang"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en"
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved === "en" || saved === "th") return saved
    } catch {
      // Storage unavailable
    }
    return "en"
  })

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      // Storage unavailable
    }
  }

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] ?? fallback ?? key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
