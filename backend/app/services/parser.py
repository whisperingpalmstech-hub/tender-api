"""
Document Parser Service
Extracts text from PDF and DOCX files
"""
import io
import tempfile
from typing import Optional
from pathlib import Path

import pdfplumber
import fitz  # PyMuPDF
from docx import Document as DocxDocument
from PIL import Image

try:
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


class ParsedDocument:
    def __init__(
        self,
        raw_text: str,
        pages: list[dict],
        tables: list[dict],
        metadata: dict
    ):
        self.raw_text = raw_text
        self.pages = pages
        self.tables = tables
        self.metadata = metadata


class DocumentParser:
    """Parse PDF and DOCX documents to extract text content."""
    
    def __init__(self):
        self.min_text_length = 100  # Minimum text to consider valid extraction
    
    async def parse(self, file_content: bytes, file_type: str) -> ParsedDocument:
        """Parse document and extract text."""
        file_type = file_type.upper()
        
        if file_type == "PDF":
            return await self._parse_pdf(file_content)
        elif file_type in ("DOCX", "DOC"):
            return await self._parse_docx(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    async def _parse_pdf(self, content: bytes) -> ParsedDocument:
        """Parse PDF document."""
        pages = []
        tables = []
        all_text = []
        
        # Try pdfplumber first (better for text-based PDFs)
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                pages.append({
                    "page_num": i + 1,
                    "content": page_text
                })
                all_text.append(page_text)
                
                # Extract tables
                page_tables = page.extract_tables()
                for table in page_tables:
                    tables.append({
                        "page": i + 1,
                        "rows": table
                    })
        
        raw_text = "\n\n".join(all_text)
        
        # If text extraction failed, try OCR
        if len(raw_text.strip()) < self.min_text_length and OCR_AVAILABLE:
            raw_text, pages = await self._ocr_pdf(content)
        
        metadata = {
            "page_count": len(pages),
            "has_tables": len(tables) > 0,
            "has_images": await self._check_for_images(content)
        }
        
        return ParsedDocument(raw_text, pages, tables, metadata)
    
    async def _ocr_pdf(self, content: bytes) -> tuple[str, list[dict]]:
        """Perform OCR on scanned PDF."""
        pages = []
        all_text = []
        
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            
            for i, page in enumerate(doc):
                # Render page to image
                pix = page.get_pixmap(dpi=300)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # OCR
                try:
                    page_text = pytesseract.image_to_string(img)
                except Exception as e:
                    print(f"OCR Error on page {i+1}: {e}")
                    page_text = "[OCR Failed: Tesseract binary not found or error]"
                    
                pages.append({
                    "page_num": i + 1,
                    "content": page_text
                })
                all_text.append(page_text)
            
            doc.close()
        except Exception as e:
            print(f"OCR Critical Error: {e}")
            return "", []

        return "\n\n".join(all_text), pages
    
    async def _check_for_images(self, content: bytes) -> bool:
        """Check if PDF contains images."""
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                if page.get_images():
                    doc.close()
                    return True
            doc.close()
        except Exception:
            pass
        return False
    
    async def _parse_docx(self, content: bytes) -> ParsedDocument:
        """Parse DOCX document."""
        doc = DocxDocument(io.BytesIO(content))
        
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        
        raw_text = "\n\n".join(paragraphs)
        
        # Extract tables
        tables = []
        for i, table in enumerate(doc.tables):
            rows = []
            for row in table.rows:
                cells = [cell.text for cell in row.cells]
                rows.append(cells)
            tables.append({
                "index": i,
                "rows": rows
            })
        
        # DOCX doesn't have pages, treat as single page
        pages = [{
            "page_num": 1,
            "content": raw_text
        }]
        
        metadata = {
            "page_count": 1,
            "has_tables": len(tables) > 0,
            "paragraph_count": len(paragraphs)
        }
        
        return ParsedDocument(raw_text, pages, tables, metadata)


# Singleton instance
_parser: Optional[DocumentParser] = None


def get_parser() -> DocumentParser:
    global _parser
    if _parser is None:
        _parser = DocumentParser()
    return _parser
