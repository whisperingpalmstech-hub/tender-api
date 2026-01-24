"""
Professional Export Service
Generates high-quality DOCX exports with company branding
"""
import io
import os
from typing import List, Dict, Optional
from datetime import datetime

from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml


class CompanyProfile:
    """Company branding configuration."""
    
    def __init__(
        self,
        name: str = "TenderAI Solutions",
        tagline: str = "Intelligent Tender Response Automation",
        address: str = "123 Business Park, Tech City\nState - 400001, India",
        phone: str = "+91 98765 43210",
        email: str = "info@tenderai.com",
        website: str = "www.tenderai.com",
        logo_path: Optional[str] = None,
        primary_color: str = "#1e3a8a",  # Deep blue
        accent_color: str = "#3b82f6",   # Bright blue
    ):
        self.name = name
        self.tagline = tagline
        self.address = address
        self.phone = phone
        self.email = email
        self.website = website
        self.logo_path = logo_path
        self.primary_color = self._hex_to_rgb(primary_color)
        self.accent_color = self._hex_to_rgb(accent_color)
    
    def _hex_to_rgb(self, hex_color: str) -> RGBColor:
        """Convert hex color to RGBColor."""
        hex_color = hex_color.lstrip('#')
        return RGBColor(
            int(hex_color[0:2], 16),
            int(hex_color[2:4], 16),
            int(hex_color[4:6], 16)
        )


class ExportService:
    """Generate professional DOCX exports with company branding."""
    
    def __init__(self, company: Optional[CompanyProfile] = None):
        self.company = company or CompanyProfile()
        
        # Font settings
        self.font_primary = "Calibri"
        self.font_heading = "Calibri Light"
        
        # Size settings
        self.size_title = Pt(28)
        self.size_h1 = Pt(16)
        self.size_h2 = Pt(14)
        self.size_h3 = Pt(12)
        self.size_body = Pt(11)
        self.size_small = Pt(9)
        
        # Colors
        self.color_text = RGBColor(0x1a, 0x1a, 0x1a)
        self.color_muted = RGBColor(0x6b, 0x72, 0x80)
        self.color_light_bg = RGBColor(0xf3, 0xf4, 0xf6)
    
    def _setup_styles(self, doc: Document):
        """Configure document styles for professional look."""
        
        # Normal style
        style = doc.styles['Normal']
        style.font.name = self.font_primary
        style.font.size = self.size_body
        style.font.color.rgb = self.color_text
        style.paragraph_format.space_after = Pt(8)
        style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        
        # Heading 1
        h1 = doc.styles['Heading 1']
        h1.font.name = self.font_heading
        h1.font.size = self.size_h1
        h1.font.bold = True
        h1.font.color.rgb = self.company.primary_color
        h1.paragraph_format.space_before = Pt(18)
        h1.paragraph_format.space_after = Pt(12)
        
        # Heading 2
        h2 = doc.styles['Heading 2']
        h2.font.name = self.font_heading
        h2.font.size = self.size_h2
        h2.font.bold = True
        h2.font.color.rgb = self.company.primary_color
        h2.paragraph_format.space_before = Pt(14)
        h2.paragraph_format.space_after = Pt(8)
        
        # Heading 3
        h3 = doc.styles['Heading 3']
        h3.font.name = self.font_primary
        h3.font.size = self.size_h3
        h3.font.bold = True
        h3.font.color.rgb = self.color_text
        h3.paragraph_format.space_before = Pt(10)
        h3.paragraph_format.space_after = Pt(6)
    
    def _add_header_footer(self, doc: Document, tender_name: str):
        """Add professional header and footer to all sections."""
        for section in doc.sections:
            # Page margins
            section.top_margin = Cm(2.5)
            section.bottom_margin = Cm(2.5)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)
            
            # Header
            header = section.header
            header_table = header.add_table(rows=1, cols=2, width=Inches(6.5))
            header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            
            # Company name in header
            cell_left = header_table.cell(0, 0)
            p = cell_left.paragraphs[0]
            run = p.add_run(self.company.name)
            run.font.size = Pt(10)
            run.font.bold = True
            run.font.color.rgb = self.company.primary_color
            
            # Tender name in header
            cell_right = header_table.cell(0, 1)
            p = cell_right.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.add_run(tender_name)
            run.font.size = Pt(9)
            run.font.color.rgb = self.color_muted
            
            # Footer
            footer = section.footer
            footer_para = footer.paragraphs[0]
            footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            run = footer_para.add_run("CONFIDENTIAL | ")
            run.font.size = Pt(8)
            run.font.color.rgb = self.color_muted
            
            run = footer_para.add_run(f"© {datetime.now().year} {self.company.name}")
            run.font.size = Pt(8)
            run.font.color.rgb = self.color_muted
    
    def _add_cover_page(self, doc: Document, tender_name: str, recipient_name: str = ""):
        """Create professional cover page."""
        
        # Top spacing
        doc.add_paragraph().paragraph_format.space_before = Pt(80)
        
        # Company Logo placeholder (if logo path exists)
        if self.company.logo_path and os.path.exists(self.company.logo_path):
            try:
                doc.add_picture(self.company.logo_path, width=Inches(2))
                doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
            except Exception:
                pass
        
        # Company Name
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(self.company.name.upper())
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = self.company.primary_color
        run.font.name = self.font_heading
        
        # Tagline
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(self.company.tagline)
        run.font.size = Pt(11)
        run.font.italic = True
        run.font.color.rgb = self.color_muted
        p.paragraph_format.space_after = Pt(60)
        
        # Decorative line
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("━" * 40)
        run.font.color.rgb = self.company.accent_color
        p.paragraph_format.space_after = Pt(40)
        
        # Document Title
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(tender_name)
        run.font.size = self.size_title
        run.font.bold = True
        run.font.color.rgb = self.color_text
        run.font.name = self.font_heading
        
        # Subtitle
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("Technical & Commercial Proposal")
        run.font.size = Pt(16)
        run.font.color.rgb = self.company.accent_color
        p.paragraph_format.space_after = Pt(80)
        
        # Details Table
        details_table = doc.add_table(rows=4, cols=2)
        details_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        details = [
            ("Submitted To:", recipient_name or "Valued Client"),
            ("Submitted By:", self.company.name),
            ("Date:", datetime.now().strftime('%d %B %Y')),
            ("Version:", "1.0"),
        ]
        
        for i, (label, value) in enumerate(details):
            # Label cell
            cell_label = details_table.cell(i, 0)
            p = cell_label.paragraphs[0]
            run = p.add_run(label)
            run.font.bold = True
            run.font.size = Pt(11)
            run.font.color.rgb = self.company.primary_color
            cell_label.width = Inches(1.5)
            
            # Value cell
            cell_value = details_table.cell(i, 1)
            p = cell_value.paragraphs[0]
            run = p.add_run(value)
            run.font.size = Pt(11)
            cell_value.width = Inches(3)
        
        # Contact info at bottom
        doc.add_paragraph().paragraph_format.space_before = Pt(80)
        
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        contact_info = f"{self.company.address.replace(chr(10), ' | ')}"
        run = p.add_run(contact_info)
        run.font.size = Pt(9)
        run.font.color.rgb = self.color_muted
        
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(f"📞 {self.company.phone}  |  ✉ {self.company.email}  |  🌐 {self.company.website}")
        run.font.size = Pt(9)
        run.font.color.rgb = self.color_muted
        
        doc.add_page_break()
    
    def _add_table_of_contents(self, doc: Document):
        """Add table of contents placeholder."""
        doc.add_heading("Table of Contents", level=1)
        
        toc_items = [
            ("1.", "Executive Summary", "3"),
            ("2.", "Company Overview", "4"),
            ("3.", "Eligibility Criteria", "5"),
            ("4.", "Technical Requirements", "6"),
            ("5.", "Compliance & Documentation", "8"),
            ("6.", "Appendices", "10"),
        ]
        
        toc_table = doc.add_table(rows=len(toc_items), cols=3)
        
        for i, (num, title, page) in enumerate(toc_items):
            row = toc_table.rows[i]
            
            # Number
            cell = row.cells[0]
            p = cell.paragraphs[0]
            run = p.add_run(num)
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = self.company.primary_color
            cell.width = Inches(0.5)
            
            # Title
            cell = row.cells[1]
            p = cell.paragraphs[0]
            run = p.add_run(title)
            run.font.size = Pt(11)
            cell.width = Inches(5)
            
            # Page
            cell = row.cells[2]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.add_run(page)
            run.font.size = Pt(11)
            run.font.color.rgb = self.color_muted
            cell.width = Inches(0.5)
        
        doc.add_page_break()
    
    def _add_executive_summary(self, doc: Document, tender_name: str):
        """Add executive summary section."""
        doc.add_heading("1. Executive Summary", level=1)
        
        summary_text = f"""
{self.company.name} is pleased to submit this comprehensive proposal in response to {tender_name}. 

We bring extensive experience and proven expertise to deliver exceptional results that meet and exceed your requirements. Our approach combines industry best practices with innovative solutions tailored to your specific needs.
        """.strip()
        
        p = doc.add_paragraph(summary_text)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        # Key highlights box
        doc.add_heading("Key Highlights", level=2)
        
        highlights = [
            "Complete compliance with all tender requirements",
            "Proven track record of successful project delivery",
            "Experienced team of certified professionals",
            "Competitive pricing with transparent cost structure",
            "Commitment to quality and timely delivery",
        ]
        
        for highlight in highlights:
            p = doc.add_paragraph(style='List Bullet')
            run = p.add_run(highlight)
            run.font.size = self.size_body
        
        doc.add_page_break()
    
    def _add_company_overview(self, doc: Document):
        """Add company overview section."""
        doc.add_heading("2. Company Overview", level=1)
        
        overview_text = f"""
{self.company.name} is a leading provider of innovative solutions with a strong commitment to excellence and customer satisfaction. With years of industry experience, we have successfully delivered numerous projects across various sectors.

Our team comprises seasoned professionals who bring deep domain expertise and technical proficiency to every engagement. We pride ourselves on our ability to understand client needs and deliver customized solutions that drive business value.
        """.strip()
        
        p = doc.add_paragraph(overview_text)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        # Company details table
        doc.add_heading("Company Details", level=2)
        
        details_table = doc.add_table(rows=5, cols=2)
        details_table.style = 'Table Grid'
        
        details = [
            ("Organization Name", self.company.name),
            ("Registered Address", self.company.address.replace('\n', ', ')),
            ("Contact Number", self.company.phone),
            ("Email Address", self.company.email),
            ("Website", self.company.website),
        ]
        
        for i, (label, value) in enumerate(details):
            row = details_table.rows[i]
            
            # Label
            cell = row.cells[0]
            self._set_cell_shading(cell, "E5E7EB")
            p = cell.paragraphs[0]
            run = p.add_run(label)
            run.font.bold = True
            run.font.size = Pt(10)
            cell.width = Inches(2)
            
            # Value
            cell = row.cells[1]
            p = cell.paragraphs[0]
            run = p.add_run(value)
            run.font.size = Pt(10)
            cell.width = Inches(4)
        
        doc.add_page_break()
    
    def _set_cell_shading(self, cell, color_hex: str):
        """Set cell background color."""
        shading_elm = parse_xml(
            f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>'
        )
        cell._tc.get_or_add_tcPr().append(shading_elm)
    
    def _add_compliance_section(
        self, 
        doc: Document, 
        section_num: int,
        section_title: str, 
        responses: List[Dict]
    ):
        """Add a compliance matrix section."""
        doc.add_heading(f"{section_num}. {section_title}", level=1)
        
        if not responses:
            p = doc.add_paragraph("No requirements in this category.")
            p.runs[0].font.italic = True
            p.runs[0].font.color.rgb = self.color_muted
            return
        
        p = doc.add_paragraph(
            f"The following table presents our detailed responses to the {section_title.lower()}:"
        )
        
        # Create compliance table
        table = doc.add_table(rows=1, cols=4)
        table.style = 'Table Grid'
        table.autofit = False
        
        # Header row
        header_cells = table.rows[0].cells
        headers = [("S.No", 0.5), ("Requirement", 2.5), ("Response", 3), ("Compliance", 0.8)]
        
        for i, (text, width) in enumerate(headers):
            cell = header_cells[i]
            self._set_cell_shading(cell, self._rgb_to_hex(self.company.primary_color))
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(text)
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            cell.width = Inches(width)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        
        # Data rows
        for idx, response in enumerate(responses, 1):
            req = response.get('requirement', {})
            row_cells = table.add_row().cells
            
            # S.No
            cell = row_cells[0]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(str(idx))
            run.font.size = Pt(10)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            
            # Requirement
            cell = row_cells[1]
            p = cell.paragraphs[0]
            run = p.add_run(req.get('requirement_text', 'N/A'))
            run.font.size = Pt(10)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            
            # Response
            cell = row_cells[2]
            p = cell.paragraphs[0]
            response_text = response.get('response_text', '')
            run = p.add_run(response_text if response_text else "Response pending")
            run.font.size = Pt(10)
            if not response_text:
                run.font.italic = True
                run.font.color.rgb = self.color_muted
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            
            # Compliance status
            cell = row_cells[3]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            status = "✓" if response_text else "○"
            run = p.add_run(status)
            run.font.size = Pt(12)
            run.font.bold = True
            if response_text:
                run.font.color.rgb = RGBColor(0x10, 0xB9, 0x81)  # Green
            else:
                run.font.color.rgb = self.color_muted
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            
            # Alternate row shading
            if idx % 2 == 0:
                for cell in row_cells:
                    self._set_cell_shading(cell, "F9FAFB")
        
        doc.add_paragraph()
    
    def _rgb_to_hex(self, rgb_color: RGBColor) -> str:
        """Convert RGBColor to hex string."""
        return f"{rgb_color[0]:02X}{rgb_color[1]:02X}{rgb_color[2]:02X}"
    
    def _add_signature_section(self, doc: Document):
        """Add signature and authorization section."""
        doc.add_heading("Declaration & Authorization", level=1)
        
        declaration = f"""
We hereby declare that the information provided in this proposal is true and accurate to the best of our knowledge. {self.company.name} is committed to fulfilling all the requirements as stated in this document.

We understand and agree to abide by all terms and conditions of the tender. This proposal shall remain valid for a period of 90 days from the date of submission.
        """.strip()
        
        p = doc.add_paragraph(declaration)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        doc.add_paragraph()
        
        # Signature block
        sig_table = doc.add_table(rows=4, cols=2)
        sig_table.alignment = WD_TABLE_ALIGNMENT.LEFT
        
        sig_details = [
            ("For:", self.company.name),
            ("Name:", "______________________"),
            ("Designation:", "______________________"),
            ("Date:", datetime.now().strftime('%d %B %Y')),
        ]
        
        for i, (label, value) in enumerate(sig_details):
            row = sig_table.rows[i]
            
            cell = row.cells[0]
            p = cell.paragraphs[0]
            run = p.add_run(label)
            run.font.bold = True
            run.font.size = Pt(11)
            cell.width = Inches(1.2)
            
            cell = row.cells[1]
            p = cell.paragraphs[0]
            run = p.add_run(value)
            run.font.size = Pt(11)
            if i == 0:
                run.font.bold = True
            cell.width = Inches(3)
        
        doc.add_paragraph()
        doc.add_paragraph()
        
        p = doc.add_paragraph()
        run = p.add_run("(Authorized Signatory)")
        run.font.size = Pt(10)
        run.font.italic = True
        run.font.color.rgb = self.color_muted
    
    async def export_to_docx(
        self,
        tender_name: str,
        responses: List[Dict],
        requirements: List[Dict],
        company_name: str = None,
        recipient_name: str = ""
    ) -> bytes:
        """Generate professional tender response document."""
        
        # Update company name if provided
        if company_name:
            self.company.name = company_name
        
        doc = Document()
        
        # Setup styles
        self._setup_styles(doc)
        
        # Add sections
        self._add_cover_page(doc, tender_name, recipient_name)
        self._add_header_footer(doc, tender_name)
        self._add_table_of_contents(doc)
        self._add_executive_summary(doc, tender_name)
        self._add_company_overview(doc)
        
        # Group responses by category
        responses_by_category = self._group_by_category(responses, requirements)
        
        # Add compliance sections
        section_num = 3
        sections = [
            ("ELIGIBILITY", "Eligibility Criteria"),
            ("TECHNICAL", "Technical Requirements"),
            ("COMPLIANCE", "Compliance & Documentation"),
        ]
        
        for category_key, section_title in sections:
            if responses_by_category.get(category_key):
                self._add_compliance_section(
                    doc, 
                    section_num, 
                    section_title, 
                    responses_by_category[category_key]
                )
                doc.add_page_break()
                section_num += 1
        
        # Signature section
        self._add_signature_section(doc)
        
        # Save to bytes
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _group_by_category(
        self,
        responses: List[Dict],
        requirements: List[Dict]
    ) -> Dict[str, List[Dict]]:
        """Group responses by requirement category."""
        req_map = {r['id']: r for r in requirements}
        grouped = {}
        
        for response in responses:
            req = req_map.get(response.get('requirement_id'))
            category = req.get('category', 'TECHNICAL') if req else 'TECHNICAL'
            if category not in grouped:
                grouped[category] = []
            grouped[category].append({**response, 'requirement': req})
        
        return grouped


# Singleton instance
_exporter: ExportService = None


def get_exporter(company: Optional[CompanyProfile] = None) -> ExportService:
    """Get or create exporter instance."""
    global _exporter
    if _exporter is None or company is not None:
        _exporter = ExportService(company)
    return _exporter
