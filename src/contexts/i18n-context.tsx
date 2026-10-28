"use client"

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react"

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
    "dashboard.loadError": "Some registry data could not be loaded. Counts may be incomplete.",
    "dashboard.retry": "Try again",
    "dashboard.partialData": "Counts and rankings include only loaded repositories.",
    "dashboard.tagsUnavailable": "Some providers do not supply tag counts.",
    "dashboard.defaultRegistry": "Default registry",
    "dashboard.noRanking": "No repository ranking data available yet.",
    "dashboard.rankingNote": "Ranked by available tag counts in loaded repositories.",
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
    "dashboard.liveOperations": "Recent recorded operations",
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

    // Registry Form
    "registryForm.titleCreate": "Add Registry",
    "registryForm.titleEdit": "Edit Registry",
    "registryForm.subtitle": "Configure the endpoint, provider, and credentials used by the dashboard.",
    "registryForm.connection": "Connection",
    "registryForm.connectionDesc": "Name and route registry traffic through the server-side proxy.",
    "registryForm.name": "Name",
    "registryForm.namePlaceholder": "e.g. Production Cluster",
    "registryForm.url": "Endpoint URL",
    "registryForm.urlPlaceholder": "https://registry.example.com",
    "registryForm.provider": "Provider Type",
    "registryForm.namespace": "Default Namespace",
    "registryForm.namespacePlaceholder": "e.g. library",
    "registryForm.optional": "Optional",
    "registryForm.auth": "Authentication",
    "registryForm.authDesc": "Credentials stay server-side and are never exposed to the browser.",
    "registryForm.authAnonymous": "Anonymous",
    "registryForm.authAnonymousNote": "Public pull access",
    "registryForm.authBasic": "Basic Auth",
    "registryForm.authBasicNote": "Username + password / PAT",
    "registryForm.authBearer": "Bearer Token",
    "registryForm.authBearerNote": "Token-based access",
    "registryForm.username": "Username",
    "registryForm.usernamePlaceholder": "Enter username",
    "registryForm.password": "Password / PAT",
    "registryForm.passwordPlaceholder": "••••••••",
    "registryForm.token": "Bearer Token",
    "registryForm.tokenPlaceholder": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "registryForm.securityNotice": "AES-256-GCM encrypted and stored safely on server",
    "registryForm.addRegistry": "Add Registry",
    "registryForm.saveChanges": "Save Changes",
    "registryForm.saving": "Saving…",
    "registryForm.testing": "Testing…",

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
    "dashboard.loadError": "โหลดข้อมูลบาง Registry ไม่สำเร็จ จำนวนที่แสดงอาจไม่ครบ",
    "dashboard.retry": "ลองอีกครั้ง",
    "dashboard.partialData": "จำนวนและอันดับอ้างอิงเฉพาะคลังที่โหลดแล้ว",
    "dashboard.tagsUnavailable": "ผู้ให้บริการบางรายไม่มีข้อมูลจำนวนแท็ก",
    "dashboard.defaultRegistry": "Registry เริ่มต้น",
    "dashboard.noRanking": "ยังไม่มีข้อมูลอันดับคลังรูปภาพ",
    "dashboard.rankingNote": "จัดอันดับจากจำนวนแท็กที่มีในคลังที่โหลดแล้ว",
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
    "dashboard.liveOperations": "กิจกรรมที่บันทึกล่าสุด",
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

    // Registry Form
    "registryForm.titleCreate": "เพิ่ม Registry",
    "registryForm.titleEdit": "แก้ไข Registry",
    "registryForm.subtitle": "กำหนดค่า Endpoint, ผู้ให้บริการ และสิทธิ์การเข้าถึงสำหรับใช้งานในแดชบอร์ด",
    "registryForm.connection": "การเชื่อมต่อ",
    "registryForm.connectionDesc": "กำหนดชื่อและปลายทางเพื่อส่งทราฟฟิกผ่าน Server-side Proxy",
    "registryForm.name": "ชื่อ Registry",
    "registryForm.namePlaceholder": "เช่น Production Cluster",
    "registryForm.url": "URL ปลายทาง",
    "registryForm.urlPlaceholder": "https://registry.example.com",
    "registryForm.provider": "ประเภทผู้ให้บริการ",
    "registryForm.namespace": "เนมสเปซเริ่มต้น",
    "registryForm.namespacePlaceholder": "เช่น library",
    "registryForm.optional": "ไม่บังคับ",
    "registryForm.auth": "การยืนยันตัวตน",
    "registryForm.authDesc": "ข้อมูลรับรองจะถูกเก็บไว้ที่ฝั่งเซิร์ฟเวอร์และไม่เปิดเผยต่อเบราว์เซอร์",
    "registryForm.authAnonymous": "ไม่ระบุตัวตน (Anonymous)",
    "registryForm.authAnonymousNote": "สำหรับการดึงอิมเมจสาธารณะ",
    "registryForm.authBasic": "ชื่อผู้ใช้และรหัสผ่าน (Basic Auth)",
    "registryForm.authBasicNote": "ชื่อผู้ใช้ + รหัสผ่าน หรือ PAT",
    "registryForm.authBearer": "Bearer Token",
    "registryForm.authBearerNote": "ยืนยันตัวตนด้วย Token โดยตรง",
    "registryForm.username": "ชื่อผู้ใช้",
    "registryForm.usernamePlaceholder": "ระบุชื่อผู้ใช้",
    "registryForm.password": "รหัสผ่าน / PAT",
    "registryForm.passwordPlaceholder": "••••••••",
    "registryForm.token": "Bearer Token",
    "registryForm.tokenPlaceholder": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "registryForm.securityNotice": "ข้อมูลรับรองถูกเข้ารหัส AES-256-GCM ปลอดภัยฝั่งเซิร์ฟเวอร์",
    "registryForm.addRegistry": "เพิ่ม Registry",
    "registryForm.saveChanges": "บันทึกการเปลี่ยนแปลง",
    "registryForm.saving": "กำลังบันทึก…",
    "registryForm.testing": "กำลังทดสอบ…",

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

let listeners: Array<() => void> = []
function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(
    (callback) => {
      listeners.push(callback)
      window.addEventListener("storage", callback)
      return () => {
        listeners = listeners.filter((l) => l !== callback)
        window.removeEventListener("storage", callback)
      }
    },
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null
        if (saved === "en" || saved === "th") return saved
      } catch {
        // Storage unavailable
      }
      return "en"
    },
    () => "en",
  )

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      // Storage unavailable
    }
    emitChange()
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
