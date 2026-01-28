'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, BarChart3, Database, Shield, ArrowRight, CheckCircle2, Clock, Zap, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function HomePage() {
    const { t, language } = useI18n();
    const isRtl = language === 'ar';

    return (
        <div
            className={cn(
                "min-h-screen bg-white text-surface-900 selection:bg-primary-100 selection:text-primary-900",
                isRtl && "font-arabic"
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-200/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[5%] right-[-5%] w-[35%] h-[35%] bg-blue-200/20 blur-[100px] rounded-full" />
                <div className="absolute top-[20%] right-[15%] w-[25%] h-[25%] bg-indigo-200/10 blur-[80px] rounded-full" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-surface-100/50">
                <div className={cn(
                    "max-w-7xl mx-auto px-6 h-20 flex items-center justify-between",
                    isRtl && "flex-row-reverse"
                )}>
                    <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 
                          flex items-center justify-center shadow-xl shadow-primary-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl text-surface-900 tracking-tighter">
                            Tender<span className="text-primary-600">Analysis</span>
                        </span>
                    </div>

                    <div className={cn("flex items-center gap-3 md:gap-6", isRtl && "flex-row-reverse")}>
                        <div className="hidden md:flex items-center gap-8 mr-6">
                            <a href="#features" className="text-sm font-semibold text-surface-500 hover:text-primary-600 transition-colors uppercase tracking-widest">{t('featuresTitle')}</a>
                            <a href="#benefits" className="text-sm font-semibold text-surface-500 hover:text-primary-600 transition-colors uppercase tracking-widest">{t('benefitsTitle')}</a>
                        </div>
                        <LanguageSwitcher />
                        <div className="flex items-center gap-2">
                            <Link href="/auth/login">
                                <Button variant="ghost" className="rounded-2xl font-bold px-6 text-surface-600 hover:text-primary-600 hover:bg-primary-50">
                                    {t('signIn')}
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button className="rounded-2xl font-bold px-8 bg-surface-900 text-white hover:bg-surface-800 shadow-xl transition-all active:scale-95">
                                    {t('signUp')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-bold mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Zap className="w-4 h-4 fill-current" />
                        <span>{t('modernStandard')}</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-surface-900 tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {t('heroTitle')}<br />
                        <span className="relative">
                            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-400 bg-clip-text text-transparent">
                                {t('heroTitleHighlight')}
                            </span>
                            <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-primary-100 rounded-full -z-10" />
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-surface-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        {t('heroSubtitle')}
                    </p>

                    <div className={cn(
                        "flex items-center justify-center gap-5 flex-wrap animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300",
                        isRtl && "flex-row-reverse"
                    )}>
                        <Link href="/auth/signup">
                            <Button
                                size="lg"
                                className="h-16 px-10 rounded-2xl text-lg font-black bg-primary-600 text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300"
                            >
                                {t('getStartedFree')}
                                <ArrowRight className={cn("w-6 h-6", isRtl ? "mr-2 rotate-180" : "ml-2")} />
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button
                                variant="ghost"
                                size="lg"
                                className="h-16 px-10 rounded-2xl text-lg font-bold border-2 border-surface-200 hover:border-primary-200 hover:bg-primary-50 transition-all duration-300"
                            >
                                {t('bookDemo')}
                            </Button>
                        </Link>
                    </div>

                    {/* Stats/Social Proof */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-surface-100 pt-16 animate-in fade-in duration-1000 delay-500">
                        <div>
                            <div className="text-4xl font-black text-surface-900 mb-1">98%</div>
                            <div className="text-sm font-bold text-surface-400 uppercase tracking-widest">{t('accuracy')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-surface-900 mb-1">10x</div>
                            <div className="text-sm font-bold text-surface-400 uppercase tracking-widest">{t('fasterAnalysis')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-surface-900 mb-1">500+</div>
                            <div className="text-sm font-bold text-surface-400 uppercase tracking-widest">{t('teamsTrust')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-surface-900 mb-1">24/7</div>
                            <div className="text-sm font-bold text-surface-400 uppercase tracking-widest">{t('expertSupport')}</div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[60%] left-[-10%] w-[300px] h-[300px] border border-primary-100 rounded-full opacity-50" />
                <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] border border-blue-50 rounded-full opacity-50" />
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 bg-surface-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-black text-surface-900 tracking-tight mb-6">
                            {t('dominateIndustry').split(t('dominateHighlight'))[0]}
                            <span className="text-primary-600">{t('dominateHighlight')}</span>
                            {t('dominateIndustry').split(t('dominateHighlight'))[1]}
                        </h2>
                        <p className="text-xl text-surface-500 max-w-2xl mx-auto font-medium">
                            {t('proToolsDesc')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Feature 1 */}
                        <div className="group p-10 rounded-[2.5rem] bg-white border border-surface-100/50 hover:border-primary-100 
                                     hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] transition-all duration-500">
                            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                                <FileText className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-surface-900 mb-4">
                                {t('feature1Title')}
                            </h3>
                            <p className="text-surface-500 leading-relaxed text-lg font-medium">
                                {t('feature1Desc')}
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-10 rounded-[2.5rem] bg-white border border-surface-100/50 hover:border-emerald-100 
                                     hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] transition-all duration-500">
                            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500">
                                <Database className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-surface-900 mb-4">
                                {t('feature2Title')}
                            </h3>
                            <p className="text-surface-500 leading-relaxed text-lg font-medium">
                                {t('feature2Desc')}
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-10 rounded-[2.5rem] bg-white border border-surface-100/50 hover:border-amber-100 
                                     hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] transition-all duration-500">
                            <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-amber-600 transition-all duration-500">
                                <BarChart3 className="w-10 h-10 text-amber-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-surface-900 mb-4">
                                {t('feature3Title')}
                            </h3>
                            <p className="text-surface-500 leading-relaxed text-lg font-medium">
                                {t('feature3Desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className={cn(
                        "grid lg:grid-cols-2 gap-24 items-center",
                        isRtl && "lg:grid-flow-col-dense"
                    )}>
                        <div className={isRtl ? "lg:col-start-2" : ""}>
                            <div className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest mb-6">
                                {t('whyChooseUs')}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-surface-900 tracking-tight mb-8 leading-tight">
                                {t('strategyNotSearch').split(t('strategyHighlight'))[0]}
                                <span className="text-primary-600">{t('strategyHighlight')}</span>
                                {t('strategyNotSearch').split(t('strategyHighlight'))[1]}
                            </h2>
                            <p className="text-xl text-surface-500 mb-10 leading-relaxed font-medium">
                                {t('portfolioMapping')}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {[
                                    { icon: Shield, text: t('strictCompliance'), desc: t('strictComplianceDesc') },
                                    { icon: Globe2, text: t('multiLanguage'), desc: t('multiLanguageDesc') },
                                    { icon: Clock, text: t('efficiencyGain'), desc: t('efficiencyGainDesc') },
                                    { icon: CheckCircle2, text: t('qaAssurance'), desc: t('qaAssuranceDesc') },
                                ].map((item, index) => (
                                    <div key={index} className={cn("space-y-2", isRtl && "text-right")}>
                                        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-surface-900 font-black tracking-tight">{item.text}</span>
                                        </div>
                                        <p className="text-sm text-surface-400 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={cn(
                            "relative group",
                            isRtl ? "lg:col-start-1" : ""
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 to-indigo-400/30 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative bg-white rounded-[3rem] border border-surface-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] p-12 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full" />
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="h-2 w-24 bg-surface-200 rounded-full" />
                                            <div className="h-2 w-40 bg-surface-100 rounded-full" />
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-primary-600" />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gradient-to-br from-surface-900 to-surface-800 rounded-3xl shadow-2xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-white/60 text-sm font-bold uppercase tracking-widest">{t('liveAnalysis')}</span>
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                                <div className="w-2 h-2 rounded-full bg-red-400/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-white text-3xl font-black tracking-tighter">{t('eligibilityScore')}</span>
                                                <span className="text-primary-400 text-5xl font-black">94%</span>
                                            </div>
                                            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                                <div className="w-[94%] h-full bg-primary-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100">
                                            <div className="text-surface-400 text-xs font-black uppercase mb-1">{t('documents')}</div>
                                            <div className="text-surface-900 text-2xl font-black">156</div>
                                        </div>
                                        <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100">
                                            <div className="text-primary-600/60 text-xs font-black uppercase mb-1">{t('timeSaved')}</div>
                                            <div className="text-primary-600 text-2xl font-black">22h</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="relative bg-surface-900 rounded-[3rem] p-16 md:p-24 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)]" />
                        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-8">
                                {t('readyToRevolutionize')}
                            </h2>
                            <p className="text-xl text-surface-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                                {t('joinTeams')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/auth/signup">
                                    <Button
                                        size="lg"
                                        className="h-16 px-12 rounded-2xl text-lg font-black bg-white text-surface-900 hover:bg-white/90 shadow-2xl transition-all hover:-translate-y-1"
                                    >
                                        {t('createAccount')}
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="h-16 px-12 rounded-2xl text-lg font-bold text-white hover:bg-white/10"
                                    >
                                        {t('contactSales')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-surface-100 bg-surface-50/30">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-black text-2xl text-surface-900">Tender Analysis</span>
                            </div>
                            <p className="text-surface-500 max-w-sm font-medium leading-relaxed">
                                {t('footerDesc')}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-surface-900 mb-6 uppercase tracking-widest text-sm">{t('product')}</h4>
                            <ul className="space-y-4 text-surface-500 font-medium">
                                <li><a href="#" className="hover:text-primary-600 transition-colors">{t('howItWorks')}</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">{t('pricing')}</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">{t('caseStudies')}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-surface-900 mb-6 uppercase tracking-widest text-sm">{t('legal')}</h4>
                            <ul className="space-y-4 text-surface-500 font-medium">
                                <li><a href="#" className="hover:text-primary-600 transition-colors">{t('privacyPolicy')}</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">{t('termsOfService')}</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
