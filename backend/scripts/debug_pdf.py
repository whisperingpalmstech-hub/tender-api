import os
import sys
import pdfplumber
import fitz

def test_pdf(file_path):
    print(f"Testing PDF: {file_path}")
    
    try:
        print("1. Trying pdfplumber...")
        with pdfplumber.open(file_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            print(f"   Success! Extracted {len(text)} characters.")
            if len(text) < 100:
                print("   WARNING: Text length < 100. Might be scanned.")
    except Exception as e:
        print(f"   FAILED: {e}")

    try:
        print("\n2. Trying PyMuPDF (fitz)...")
        doc = fitz.open(file_path)
        print(f"   Opened successfully. Pages: {len(doc)}")
        for page in doc:
             # Just try to access it
             _ = page.get_text()
        print("   Success!")
    except Exception as e:
        print(f"   FAILED: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_pdf(sys.argv[1])
    else:
        print("Please provide a file path.")
