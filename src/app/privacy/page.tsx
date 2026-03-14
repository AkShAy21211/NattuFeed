'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Lock,
      iconBg: 'bg-emerald-50',
      iconBorder: 'border-emerald-100',
      iconColor: 'text-emerald-500',
      title: t('privacyCollectTitle'),
      content: [
        t('privacyCollect1'),
        t('privacyCollect2'),
        t('privacyCollect3'),
        t('privacyCollect4'),
      ]
    },
    {
      icon: Eye,
      iconBg: 'bg-blue-50',
      iconBorder: 'border-blue-100',
      iconColor: 'text-blue-500',
      title: t('privacyUsageTitle'),
      content: [
        t('privacyUsage1'),
        t('privacyUsage2'),
        t('privacyUsage3'),
        t('privacyUsage4'),
      ]
    },
    {
      icon: Database,
      iconBg: 'bg-purple-50',
      iconBorder: 'border-purple-100',
      iconColor: 'text-purple-500',
      title: t('privacyThirdPartyTitle'),
      content: [
        t('privacyThirdParty1'),
        t('privacyThirdParty2'),
        t('privacyThirdParty3'),
      ]
    },
    {
      icon: Trash2,
      iconBg: 'bg-red-50',
      iconBorder: 'border-red-100',
      iconColor: 'text-red-400',
      title: t('privacyRightsTitle'),
      content: [
        t('privacyRights1'),
        t('privacyRights2'),
        t('privacyRights3'),
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-16 animate-in fade-in duration-500">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors group">
          <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </Link>
        <h1 className="text-[13px] font-black uppercase tracking-[0.2em] text-gray-900">
          {t('privacyPolicyTitle')}
        </h1>
        <div className="w-9" />
      </header>

      <main className="max-w-md mx-auto px-5 pt-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-1">
            {t('privacyPolicyTitle')}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {t('lastUpdated')}
          </p>
        </div>

        <section className="mb-8 animate-in slide-in-from-bottom duration-500 delay-100">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {t('privacyHeroIntro')}
          </p>
        </section>

        <div className="space-y-8">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <section key={i} className="animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${150 + i * 60}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 ${section.iconBg} rounded-xl flex items-center justify-center border ${section.iconBorder} shrink-0`}>
                    <Icon className={`w-4 h-4 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-2.5 pl-2">
                  {section.content.map((point, j) => (
                    <li key={j} className="flex gap-2.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                      <p className="text-[13px] text-gray-500 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="h-px bg-gray-100 w-full my-10" />

        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-in slide-in-from-bottom duration-500 mb-4">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black text-primary uppercase tracking-wider">{t('contactLabel')}</span>
          </div>
          <p className="text-[12px] text-gray-400 text-center leading-relaxed">
            {t('questionsPrivacy')}{' '}
            <a href="mailto:nimbact@gmail.com" className="font-black text-primary underline underline-offset-2">
              nimbact@gmail.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}