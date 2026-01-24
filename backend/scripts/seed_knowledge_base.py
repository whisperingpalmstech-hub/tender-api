"""
Sample Knowledge Base Seed Data
Run this script to populate initial knowledge base content
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase import get_supabase
from app.services.matcher import get_matcher

SAMPLE_KB_ITEMS = [
    # ==================== COMPANY PROFILE & LEGAL ====================
    {
        "title": "Company Registration & Legal Status",
        "content": "TechSolutions India Pvt Ltd is a registered company incorporated under the Companies Act, 2013 (CIN: U72200MH2010PTC123456). The company was established in 2010 and has been operating for over 15 years. We are a Private Limited Company with authorized capital of ₹50 Crores and paid-up capital of ₹25 Crores.",
        "category": "Legal"
    },
    {
        "title": "GST Registration",
        "content": "The company holds valid GST registration (GSTIN: 27AABCT1234A1ZZ) and is fully compliant with all GST regulations. We file regular monthly and annual GST returns and maintain complete tax compliance records.",
        "category": "Legal"
    },
    {
        "title": "PAN Registration",
        "content": "The company holds a valid Permanent Account Number (PAN: AABCT1234A) issued by the Income Tax Department of India. All statutory filings are up to date.",
        "category": "Legal"
    },
    {
        "title": "Non-Blacklisting Declaration",
        "content": "TechSolutions India confirms that it has never been blacklisted, debarred, or banned by any Central Government, State Government, Public Sector Undertaking (PSU), or any statutory authority in India or abroad. We maintain a clean compliance record with all government bodies.",
        "category": "Compliance"
    },
    {
        "title": "No Criminal Proceedings",
        "content": "We confirm that there are no pending criminal proceedings, legal cases, or investigations against the company or its directors that could impact our ability to execute contractual obligations. A self-declaration certificate can be provided upon request.",
        "category": "Legal"
    },
    
    # ==================== FINANCIAL STRENGTH ====================
    {
        "title": "Annual Turnover - Financial Strength",
        "content": "Our company has demonstrated strong financial performance with annual turnover exceeding ₹75 Crores in each of the last 3 financial years: FY 2022-23 (₹78 Crores), FY 2023-24 (₹85 Crores), FY 2024-25 (₹92 Crores). This reflects consistent year-over-year growth of 15% or more.",
        "category": "Financial"
    },
    {
        "title": "Positive Net Worth",
        "content": "As per our latest audited balance sheet (FY 2024-25), the company maintains a positive net worth of ₹45 Crores with healthy reserves and surplus. Our debt-to-equity ratio is maintained at a conservative 0.3:1.",
        "category": "Financial"
    },
    {
        "title": "Audited Financial Statements",
        "content": "Our financial statements for the last 3 years (FY 2022-23, FY 2023-24, FY 2024-25) have been audited by Deloitte Haskins & Sells LLP, a reputed Big-4 audit firm. Complete audited balance sheets, profit & loss statements, and cash flow statements are available for submission.",
        "category": "Financial"
    },
    {
        "title": "Bank Guarantee Capability",
        "content": "The company has established banking relationships with State Bank of India, HDFC Bank, and ICICI Bank. We have approved credit limits of ₹25 Crores and can provide Bank Guarantees of up to ₹30 Lakhs as EMD or Performance Guarantee within 5 working days.",
        "category": "Financial"
    },
    
    # ==================== CERTIFICATIONS ====================
    {
        "title": "ISO 27001:2013 Information Security Certification",
        "content": "TechSolutions India is ISO 27001:2013 certified for Information Security Management Systems (ISMS). Certificate Number: IS-2023-456789, issued by Bureau Veritas on March 15, 2023, valid until March 14, 2026. The certification covers our entire IT operations including software development, data center management, cloud services, and customer data handling.",
        "category": "Certifications"
    },
    {
        "title": "ISO 9001:2015 Quality Management Certification",
        "content": "We hold ISO 9001:2015 certification for Quality Management Systems. Certificate Number: QMS-2022-789012, issued by TÜV SÜD on June 1, 2022, valid until May 31, 2025. This certification demonstrates our commitment to consistent quality delivery, customer satisfaction, and continuous process improvement.",
        "category": "Certifications"
    },
    {
        "title": "CMMI Level 3 Certification",
        "content": "Our organization is appraised at CMMI (Capability Maturity Model Integration) Level 3 - Defined. Appraisal ID: CMMI-2023-IND-1234, conducted by SEI-authorized lead appraiser in August 2023. This demonstrates our mature, defined, and repeatable software development processes with quantitative project management capabilities.",
        "category": "Certifications"
    },
    {
        "title": "STQC Certification",
        "content": "Our products and services are STQC (Standardization Testing and Quality Certification) empaneled by the Government of India, meeting all quality standards for government IT projects.",
        "category": "Certifications"
    },
    
    # ==================== EXPERIENCE & PROJECTS ====================
    {
        "title": "ERP Implementation Experience",
        "content": "We have over 10 years of experience in ERP implementation, having successfully delivered 25+ enterprise ERP projects. Our ERP practice team consists of 50+ certified consultants with expertise in SAP, Oracle, and custom ERP solutions. We have implemented ERP systems for organizations ranging from 500 to 10,000+ users.",
        "category": "Experience"
    },
    {
        "title": "Similar Project - State Government ERP (₹15 Crores)",
        "content": "Project: Integrated ERP System for Rajasthan State Government. Value: ₹15.5 Crores. Duration: 18 months. Scope: Implementation of Finance, HR, Procurement, and Project Management modules for 20+ departments and 2,500+ users. Status: Successfully delivered on time in December 2023. Client Contact: Director IT, Government of Rajasthan.",
        "category": "Experience"
    },
    {
        "title": "Similar Project - Central PSU ERP (₹12 Crores)",
        "content": "Project: ERP Modernization for BHEL. Value: ₹12 Crores. Duration: 15 months. Scope: Complete ERP overhaul covering Finance & Accounting, Supply Chain, HR, and Asset Management modules. 3,000+ users across 8 plants. Status: Completed in March 2024 with 99.5% uptime.",
        "category": "Experience"
    },
    {
        "title": "Similar Project - Municipal Corporation ERP (₹10 Crores)",
        "content": "Project: e-Governance ERP for Pune Municipal Corporation. Value: ₹10.2 Crores. Duration: 12 months. Scope: Citizen services portal, internal workflow management, financial accounting, property tax, and HR modules. 1,500 internal users, 2 million+ citizen transactions. Status: Operational since August 2023.",
        "category": "Experience"
    },
    {
        "title": "Similar Project - Healthcare ERP (₹11 Crores)",
        "content": "Project: Hospital Management System for AIIMS Delhi. Value: ₹11 Crores. Duration: 14 months. Scope: Patient management, inventory, billing, HR, and financial modules integrated with National Health Stack. 4,000+ users. Status: Live since November 2023.",
        "category": "Experience"
    },
    {
        "title": "Similar Project - University ERP (₹8 Crores)",
        "content": "Project: Unified ERP for Central University System. Value: ₹8.5 Crores. Duration: 12 months. Scope: Student lifecycle management, faculty HR, finance, procurement, and examination modules for 5 universities. 15,000+ users. Delivered in 2024.",
        "category": "Experience"
    },
    
    # ==================== MANPOWER & TEAM ====================
    {
        "title": "Full-Time Employee Strength",
        "content": "TechSolutions India employs 650+ full-time professionals on our payroll. This includes 400+ software engineers, 50+ certified consultants, 80+ support staff, 60+ project managers, and 60+ administrative personnel. Our attrition rate is below 12%, ensuring project continuity.",
        "category": "Team"
    },
    {
        "title": "Certified ERP Consultants",
        "content": "Our team includes 45+ certified ERP consultants with certifications including: SAP Certified Application Associates (20+), Oracle Certified Professionals (15+), Microsoft Dynamics Certified (10+). All consultants have minimum 5 years of hands-on ERP implementation experience.",
        "category": "Team"
    },
    {
        "title": "Project Management Capability",
        "content": "Our project management team includes 15+ PMP (Project Management Professional) certified managers with average experience of 12+ years. Each project is assigned a dedicated Project Manager who is responsible for timelines, quality, and client communication.",
        "category": "Team"
    },
    {
        "title": "Database Administrator Team",
        "content": "We have a dedicated team of 8 certified Database Administrators: 5 Oracle Certified DBAs (OCP), 3 Microsoft SQL Server certified DBAs. They handle database design, performance tuning, backup/recovery, and high availability configurations.",
        "category": "Team"
    },
    {
        "title": "Proposed Project Team",
        "content": "For this project, we propose a dedicated team of 35 professionals: 1 Program Director (15+ years), 2 Project Managers (PMP certified, 10+ years each), 10 Senior Consultants, 15 Technical Developers, 4 QA Engineers, and 3 Support Engineers.",
        "category": "Team"
    },
    
    # ==================== ERP FUNCTIONAL MODULES ====================
    {
        "title": "Finance and Accounting Module",
        "content": "Our ERP Finance module provides comprehensive financial management including: General Ledger with multi-dimensional chart of accounts, Accounts Payable with 3-way matching, Accounts Receivable with aging analysis, Budget Management with variance tracking, Fixed Asset Management with depreciation, Bank Reconciliation with auto-matching, GST Compliance with automated returns, and Multi-currency support with real-time exchange rates.",
        "category": "Technical"
    },
    {
        "title": "Human Resource Management Module",
        "content": "Our HRMS module covers complete employee lifecycle: Employee Master Data with 100+ configurable fields, Payroll Processing compliant with PF/ESI/TDS/Professional Tax, Leave Management with workflow approvals, Attendance & Time Tracking with biometric integration, Performance Appraisal with KRA/KPI framework, Training & Development tracking, and Recruitment with applicant tracking system.",
        "category": "Technical"
    },
    {
        "title": "Procurement and Inventory Module",
        "content": "Our Procurement module supports end-to-end procure-to-pay: Vendor Master with performance rating, Purchase Requisition with multi-level approval, Purchase Orders with GRN matching, Goods Receipt & Inspection workflow, Inventory Control with FIFO/LIFO/Weighted Average, Warehouse Management with bin-level tracking, and GeM (Government e-Marketplace) Integration for government procurement compliance.",
        "category": "Technical"
    },
    {
        "title": "Project Management Module",
        "content": "Our Project Management module enables effective project execution: Project Planning with WBS and Gantt charts, Resource Allocation with skill-based assignment, Milestone Tracking with automated alerts, Budget vs Actual Analysis with EVM metrics, Risk Register and Issue Tracking, Document Management with version control, and Integration with finance for project costing.",
        "category": "Technical"
    },
    
    # ==================== TECHNICAL SPECIFICATIONS ====================
    {
        "title": "System Performance - Response Time",
        "content": "Our ERP system is designed for high performance with guaranteed response time of less than 2 seconds for 95% of all transactions under normal load conditions. Stress testing has validated response times up to 10,000 concurrent transactions per minute.",
        "category": "Technical"
    },
    {
        "title": "Concurrent User Support",
        "content": "The system architecture supports 2,000+ concurrent users without performance degradation. Load balancing, connection pooling, and horizontal scaling ensure seamless experience even during peak usage. We have successfully tested with 5,000 concurrent sessions.",
        "category": "Technical"
    },
    {
        "title": "Database Capacity",
        "content": "Our database architecture supports 50+ TB of data with automated archival, partitioning, and indexing strategies. We use Oracle 19c Enterprise Edition and PostgreSQL 15+ based on client preference, both supporting enterprise-grade features.",
        "category": "Technical"
    },
    {
        "title": "System Availability SLA",
        "content": "We guarantee 99.9% system availability (excluding scheduled maintenance windows). This translates to less than 8.76 hours of unplanned downtime per year. Our uptime is monitored 24/7 with automated failover mechanisms.",
        "category": "Technical"
    },
    {
        "title": "Technology Stack",
        "content": "Our ERP solution is built on modern technology: Web-based responsive UI (Angular/React), RESTful microservices architecture, Apache Tomcat/Spring Boot application server, Oracle 19c or PostgreSQL 14+ database, Redis for caching, Elasticsearch for search, Docker/Kubernetes for containerization. Mobile apps available for Android and iOS.",
        "category": "Technical"
    },
    {
        "title": "Cloud Compatibility",
        "content": "Our solution is cloud-ready with deployment support for AWS, Azure, and GCP. Architecture follows 12-factor app principles enabling easy cloud migration. We support hybrid deployment models with on-premise and cloud components.",
        "category": "Technical"
    },
    
    # ==================== SECURITY REQUIREMENTS ====================
    {
        "title": "Role-Based Access Control (RBAC)",
        "content": "Our system implements comprehensive Role-Based Access Control with hierarchical role definitions, segregation of duties, least privilege principle, field-level and record-level security, and complete audit trail of all access attempts and changes.",
        "category": "Security"
    },
    {
        "title": "Multi-Factor Authentication",
        "content": "We support Multi-Factor Authentication (MFA) including: OTP via SMS and Email, Authenticator apps (Google/Microsoft), Hardware tokens, Biometric authentication integration, and Aadhaar-based e-KYC authentication for government projects.",
        "category": "Security"
    },
    {
        "title": "Data Encryption",
        "content": "All data is protected with industry-standard encryption: AES-256 encryption for data at rest, TLS 1.3 for data in transit, HSM-based key management, Encrypted backups, and Database Transparent Data Encryption (TDE).",
        "category": "Security"
    },
    {
        "title": "Audit Trail",
        "content": "Complete audit trail is maintained for all system activities including: user logins/logouts, data creation/modification/deletion, report generation, approval workflows, and system configuration changes. Audit logs are tamper-proof and retained for 7 years.",
        "category": "Security"
    },
    {
        "title": "Data Residency - India",
        "content": "We ensure complete data residency within India. All data centers are located in India (Mumbai and Chennai). No data is transferred outside Indian borders. We comply with IT Act 2000, IT Rules 2011, and upcoming DPDP Act requirements.",
        "category": "Security"
    },
    
    # ==================== INTEGRATION CAPABILITIES ====================
    {
        "title": "Aadhaar Integration",
        "content": "Our system supports Aadhaar-based authentication through UIDAI's official APIs. We are AUA/KUA compliant and can implement e-KYC, demographic authentication, and OTP-based verification for user onboarding and transaction authentication.",
        "category": "Integration"
    },
    {
        "title": "PFMS Integration",
        "content": "We have experience integrating with Public Financial Management System (PFMS) for government projects. Our system can push/pull payment data, generate PFMS-compliant reports, and support Direct Benefit Transfer (DBT) workflows.",
        "category": "Integration"
    },
    {
        "title": "NIC Email Integration",
        "content": "Our system can integrate with NIC email services (gov.in domain) for official communications, notifications, and OTP delivery for government implementations.",
        "category": "Integration"
    },
    {
        "title": "REST API & SSO Support",
        "content": "We provide comprehensive REST APIs with OAuth 2.0 authentication, rate limiting, and versioning. Single Sign-On (SSO) is supported via SAML 2.0 and OpenID Connect for integration with existing identity providers.",
        "category": "Integration"
    },
    
    # ==================== COMPLIANCE & STANDARDS ====================
    {
        "title": "IT Act 2000 Compliance",
        "content": "Our solutions are fully compliant with the Information Technology Act 2000 and its amendments. We implement required security practices, maintain digital signatures, ensure data protection, and follow prescribed procedures for electronic records.",
        "category": "Compliance"
    },
    {
        "title": "GIGW 3.0 Compliance",
        "content": "Our web applications comply with Guidelines for Indian Government Websites (GIGW) 3.0 including: accessibility standards, bilingual support (English & Hindi), security guidelines, and standard government website structure.",
        "category": "Compliance"
    },
    {
        "title": "WCAG 2.1 Accessibility",
        "content": "Our applications meet WCAG 2.1 Level AA accessibility standards ensuring usability for persons with disabilities. Features include screen reader compatibility, keyboard navigation, high contrast modes, and text resizing support.",
        "category": "Compliance"
    },
    
    # ==================== DOCUMENTATION & SUPPORT ====================
    {
        "title": "Documentation Deliverables",
        "content": "We provide comprehensive documentation including: System Requirements Specification (SRS), High-Level Design (HLD), Low-Level Design (LLD), Database Design Document, Test Plan and Test Cases, User Manuals in English and Hindi, System Administration Manual, Deployment Guide, and Disaster Recovery Plan.",
        "category": "Documentation"
    },
    {
        "title": "Training Programs",
        "content": "We offer structured training programs: Train-the-Trainer sessions for 20+ master trainers, End-user training with role-based modules, Administrator training for IT staff, Training materials (videos, manuals, quick reference cards), Online training portal access for 1 year.",
        "category": "Support"
    },
    {
        "title": "Warranty & Support SLA",
        "content": "We provide 1-year comprehensive warranty post Go-Live including: 24x7 support for critical issues, 4-hour response time for P1 issues, 8-hour resolution for P1, 24-hour resolution for P2, Unlimited bug fixes, Monthly health checks, and Quarterly reviews.",
        "category": "Support"
    },
    {
        "title": "Annual Maintenance Contract",
        "content": "Post-warranty, we offer 5-year AMC with: 24x7 helpdesk, preventive maintenance, performance optimization, security patches, regulatory updates, 2 minor version upgrades per year, and dedicated account manager.",
        "category": "Support"
    },
    {
        "title": "Disaster Recovery Plan",
        "content": "Our DR plan ensures business continuity with: RPO of 15 minutes and RTO of 4 hours, geo-redundant backup sites, automated failover, regular DR drills (quarterly), and documented recovery procedures for all critical scenarios.",
        "category": "Technical"
    },
    
    # ==================== IMPLEMENTATION METHODOLOGY ====================
    {
        "title": "Implementation Methodology",
        "content": "We follow a proven implementation methodology with 4 phases: Phase 1 (3 months) - Requirements gathering, gap analysis, and solution design. Phase 2 (6 months) - Development, customization, integration, and UAT. Phase 3 (3 months) - Data migration, training, parallel run, and Go-Live. Phase 4 (ongoing) - Post-implementation support and optimization.",
        "category": "Delivery"
    },
    {
        "title": "Project Governance",
        "content": "We establish strong project governance with: Steering Committee (monthly), Project Review meetings (weekly), Daily standups, Defined escalation matrix, Change control process, Risk management framework, and Quality gates at each phase.",
        "category": "Delivery"
    },
    {
        "title": "Data Migration Approach",
        "content": "Our data migration approach includes: Legacy system analysis, Data cleansing and transformation, Mapping to new schema, Trial migrations, Validation scripts, Reconciliation reports, Parallel run period, and Final cutover with rollback plan.",
        "category": "Delivery"
    },
    {
        "title": "Human Review Assurance",
        "content": "All deliverables, reports, and tender responses are reviewed and approved by authorized personnel before submission. Our quality assurance process includes multiple review stages with documented sign-offs.",
        "category": "Compliance"
    },
    {
        "title": "No Auto-Submission Policy",
        "content": "We confirm that no system functionality enables automatic submission of tenders, bids, or official responses without explicit human approval and verification. All submissions require manual authorization.",
        "category": "Compliance"
    }
]


def seed_knowledge_base():
    """Seed the knowledge base with sample data."""
    supabase = get_supabase()
    matcher = get_matcher()
    
    print("Seeding knowledge base...")
    
    for item in SAMPLE_KB_ITEMS:
        # Insert into database
        result = supabase.table('knowledge_base').insert({
            'title': item['title'],
            'content': item['content'],
            'category': item['category'],
            'version': 1,
            'is_active': True,
        }).execute()
        
        if result.data:
            new_item = result.data[0]
            # Add to vector index
            matcher.add_item(
                item_id=new_item['id'],
                content=item['content'],
                metadata={'title': item['title'], 'category': item['category']}
            )
            print(f"  Added: {item['title']}")
    
    print(f"\nSeeded {len(SAMPLE_KB_ITEMS)} knowledge base items.")


if __name__ == "__main__":
    seed_knowledge_base()
