'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    FileText,
    CheckCircle,
    Zap,
    Shield,
    Clock,
    ArrowRight,
    Upload,
    Search,
    FileCheck,
    Download,
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
                                flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-surface-900">Tender Analysis</span>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 
                        text-primary-700 text-sm font-medium mb-6">
                        <Zap className="w-4 h-4" />
                        Enterprise Tender Response Solution
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 max-w-4xl mx-auto leading-tight">
                        Transform Tender Documents into
                        <span className="text-gradient"> Winning Proposals</span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto">
                        Analyze tender requirements, match with your company data,
                        and generate professional responses in minutes instead of days.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/auth/login">
                            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                Get Started
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button variant="secondary" size="lg">
                                Sign In
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                        {[
                            { value: '80%', label: 'Time Saved' },
                            { value: '10x', label: 'Faster Response' },
                            { value: '95%', label: 'Accuracy Rate' },
                            { value: '24/7', label: 'Available' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</div>
                                <div className="text-sm text-surface-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
                            How It Works
                        </h2>
                        <p className="mt-4 text-lg text-surface-600 max-w-2xl mx-auto">
                            Four simple steps to transform any tender document into a professional proposal
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Upload,
                                title: 'Upload Document',
                                description: 'Upload your PDF or DOCX tender document. We support scanned documents too.',
                                step: '01',
                            },
                            {
                                icon: Search,
                                title: 'Analyze Requirements',
                                description: 'System extracts and categorizes all requirements automatically.',
                                step: '02',
                            },
                            {
                                icon: FileCheck,
                                title: 'Match & Generate',
                                description: 'Requirements are matched with your company data to create responses.',
                                step: '03',
                            },
                            {
                                icon: Download,
                                title: 'Export Proposal',
                                description: 'Download professional DOCX proposal ready for submission.',
                                step: '04',
                            },
                        ].map((item, index) => (
                            <Card key={index} className="p-6 text-center card-hover">
                                <div className="text-4xl font-bold text-primary-100 mb-4">{item.step}</div>
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
                                    flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <item.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-surface-900 mb-2">{item.title}</h3>
                                <p className="text-surface-600 text-sm">{item.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 bg-gradient-to-br from-surface-50 to-surface-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
                            Why Choose Tender Analysis
                        </h2>
                        <p className="mt-4 text-lg text-surface-600 max-w-2xl mx-auto">
                            Built for enterprises that need reliable, professional tender responses
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Clock,
                                title: 'Save Hours of Work',
                                description: 'What used to take days now takes minutes. Analyze documents and generate responses instantly.',
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                icon: CheckCircle,
                                title: 'Never Miss Requirements',
                                description: 'Automatic extraction ensures every requirement is identified and addressed.',
                                color: 'from-emerald-500 to-green-500',
                            },
                            {
                                icon: Shield,
                                title: 'Enterprise Security',
                                description: 'Your data is encrypted and secure. Role-based access control for team collaboration.',
                                color: 'from-violet-500 to-purple-500',
                            },
                        ].map((feature, index) => (
                            <Card key={index} className="p-8 card-hover">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} 
                                    flex items-center justify-center mb-6 shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-surface-900 mb-3">{feature.title}</h3>
                                <p className="text-surface-600">{feature.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Knowledge Base Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-6">
                                Your Company Knowledge, Always Available
                            </h2>
                            <p className="text-lg text-surface-600 mb-8">
                                Build a powerful knowledge base from your company's past proposals,
                                certifications, and capabilities. The system finds the best matches
                                for every tender requirement.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Past proposal content reuse',
                                    'Company certifications & credentials',
                                    'Technical capabilities & specifications',
                                    'Project case studies & references',
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-surface-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <Card className="p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <Search className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-surface-900">Requirement Match</div>
                                        <div className="text-xs text-surface-500">Finding best content...</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'ISO 9001 Certification', match: '95%' },
                                        { label: 'Project Experience', match: '88%' },
                                        { label: 'Technical Capability', match: '82%' },
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                                            <span className="text-sm text-surface-700">{item.label}</span>
                                            <span className="text-sm font-semibold text-emerald-600">{item.match}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl -z-10 opacity-20"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-12 text-center bg-gradient-to-br from-primary-500 to-primary-600 border-0 shadow-2xl">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Ready to Win More Tenders?
                        </h2>
                        <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
                            Join leading companies using Tender Analysis to streamline their
                            proposal process and improve win rates.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/auth/login">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="bg-white text-primary-600 hover:bg-primary-50"
                                    rightIcon={<ArrowRight className="w-5 h-5" />}
                                >
                                    Get Started
                                </Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button
                                    size="lg"
                                    className="bg-primary-700 hover:bg-primary-800 text-white border-0"
                                >
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-surface-900 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 
                                flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">Tender Analysis</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-surface-400">
                            <span>© 2026 Tender Analysis. All rights reserved.</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
