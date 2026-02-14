import sys
import asyncio
import re
from typing import List, Optional
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from app.services.discovery.base import BaseScraper, DiscoveredTender

class GeMScraper(BaseScraper):
    def __init__(self, source_url: str = "https://bidplus.gem.gov.in/bidlists", config: dict = None):
        super().__init__(source_url, config)
        self.portal_name = "Government e-Marketplace (GeM)"

    async def scan(self) -> List[DiscoveredTender]:
        """
        Scans GeM Bid Lists for recent tenders.
        Ensures ProactorEventLoop is used on Windows to support subprocesses.
        """
        if sys.platform == 'win32':
            # Playwright requires ProactorEventLoop for subprocesses on Windows.
            # If the current loop is not Proactor, we run the scan in a separate thread with its own loop.
            loop = asyncio.get_event_loop()
            if not isinstance(loop, asyncio.ProactorEventLoop):
                print("[GeMScraper] Current loop is not Proactor. Running in dedicated thread...")
                import threading
                from concurrent.futures import ThreadPoolExecutor
                
                def _run_sync_scan():
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                    try:
                        return new_loop.run_until_complete(self._do_scan_internal())
                    finally:
                        new_loop.close()
                
                with ThreadPoolExecutor(max_workers=1) as executor:
                    return await loop.run_in_executor(executor, _run_sync_scan)

        return await self._do_scan_internal()

    def _parse_gem_date(self, date_text: str) -> Optional[datetime]:
        if not date_text: return None
        # Remove labels like "Bid Start Date:", "End Date:", "Bid End Date/Time:" using regex
        clean_text = re.sub(r'^[A-Za-z\s/]+:', '', date_text).strip()
        
        # Try various formats commonly used by GeM
        formats = [
            "%d-%m-%Y %H:%M:%S",   # 24h with seconds
            "%d-%m-%Y %I:%M %p",   # 12h AM/PM
            "%d-%m-%Y %H:%M",      # 24h no seconds
            "%d-%m-%Y",            # Date only
            "%b %d, %Y",           # Feb 6, 2026
        ]
        for fmt in formats:
            try:
                return datetime.strptime(clean_text, fmt)
            except ValueError:
                continue
        return None

    async def _do_scan_internal(self) -> List[DiscoveredTender]:
        discovered = []
        async with async_playwright() as p:
            # Using a realistic user agent to avoid bot detection and increasing timeout
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Referer": "https://www.google.com/"
                }
            )
            page = await context.new_page()
            
            # Set a longer timeout (60 seconds) as GeM can be slow
            page.set_default_timeout(60000)
            
            try:
                # Go to GeM Bid List page
                target_url = self.source_url
                if "bidlists" in target_url:
                    target_url = "https://bidplus.gem.gov.in/all-bids"
                
                print(f"[GeMScraper] Navigating to {target_url}...")
                await page.goto(target_url, wait_until="load", timeout=60000)
                
                # Wait for content to load
                await asyncio.sleep(5)
            except Exception as e:
                print(f"[GeMScraper] Navigation failed: {e}")
                await browser.close()
                return []
            
            # Extract content
            content = await page.content()
            soup = BeautifulSoup(content, "lxml")
            
            # 1. Try old structure (div.border-bid)
            bid_cards = soup.find_all("div", class_="border-bid")
            
            # 2. Try new structure (div.card)
            if not bid_cards:
                bid_cards = soup.find_all("div", class_="card")
            
            print(f"[GeMScraper] Found {len(bid_cards)} potential bid cards.")
            
            for card in bid_cards:
                try:
                    bid_id = "N/A"
                    title = "N/A"
                    authority = "N/A"
                    start_date = None
                    end_date = None
                    doc_url = None
                    
                    # Case A: Old Structure (div.border-bid)
                    if "border-bid" in card.get("class", []):
                        bid_no_elem = card.find("a", class_="bid_no")
                        if bid_no_elem:
                            bid_id = bid_no_elem.text.strip()
                            doc_url = bid_no_elem.get("href")
                        
                        items_elem = card.find("div", class_="item_name")
                        title = items_elem.text.strip() if items_elem else "N/A"
                        
                        dept_elem = card.find("div", class_="department")
                        if dept_elem:
                            authority = dept_elem.get_text(separator=" ").strip()
                        
                        dates_div = card.find("div", class_="bid_date")
                        if dates_div:
                            date_texts = dates_div.get_text(separator="|").split("|")
                            for text in date_texts:
                                if "Bid Start Date" in text:
                                    start_date = self._parse_gem_date(text)
                                if "Bid End Date" in text:
                                    end_date = self._parse_gem_date(text)
                    
                    # Case B: New Structure (div.card)
                    else:
                        bid_no_elem = card.find("a", class_="bid_no_hover")
                        if bid_no_elem:
                            bid_id = bid_no_elem.text.strip()
                            doc_url = bid_no_elem.get("href")
                        
                        # Find details in card-body
                        card_body = card.find("div", class_="card-body")
                        if card_body:
                            # 1. Extract Items
                            items_container = card_body.find("div", class_="col-md-4")
                            if items_container:
                                popover = items_container.find("a", attrs={"data-toggle": "popover"})
                                if popover and popover.get("data-content"):
                                    title = popover.get("data-content").strip()
                                else:
                                    title = items_container.get_text().replace("Items:", "").replace("Quantity:", "").strip()
                                    if "\n" in title: title = title.split("\n")[0].strip()

                            # 2. Extract Authority
                            dept_container = card_body.find("div", class_="col-md-5")
                            if dept_container:
                                dept_text = dept_container.get_text(separator=" ").strip()
                                authority = dept_text.replace("Department Name And Address:", "").strip()
                            
                            # 3. Date Extraction
                            start_span = card_body.find("span", class_="start_date") or card_body.find(string=re.compile(r"Start Date", re.I))
                            if start_span:
                                date_text = start_span.parent.get_text() if hasattr(start_span, 'parent') else str(start_span)
                                start_date = self._parse_gem_date(date_text)
                            
                            end_span = card_body.find("span", class_="end_date") or card_body.find(string=re.compile(r"End Date|Closing Date", re.I))
                            if end_span:
                                date_text = end_span.parent.get_text() if hasattr(end_span, 'parent') else str(end_span)
                                end_date = self._parse_gem_date(date_text)


                    if end_date and end_date < datetime.now():
                        print(f"[GeMScraper] Skipping expired tender {bid_id} (Deadline: {end_date})")
                        continue

                    if bid_id != "N/A":
                        discovered.append(DiscoveredTender(
                            external_ref_id=bid_id,
                            title=title,
                            authority=authority,
                            publish_date=start_date,
                            submission_deadline=end_date,
                            source_portal=self.portal_name,
                            description=f"Items: {title}",
                            raw_data={"url": doc_url}
                        ))
                except Exception as e:
                    print(f"[GeMScraper] Error parsing card: {e}")
            
            await browser.close()
            
        return discovered

    async def get_details(self, tender: DiscoveredTender) -> DiscoveredTender:
        """
        Fetches documents for a GeM tender.
        """
        # GeM usually links to a PDF for the bid document
        if tender.raw_data and tender.raw_data.get("url"):
            base_url = "https://bidplus.gem.gov.in"
            relative_url = tender.raw_data["url"]
            full_url = relative_url if relative_url.startswith("http") else f"{base_url}/{relative_url.lstrip('/')}"
            
            tender.attachments = [
                {
                    "name": f"Bid_Document_{tender.external_ref_id}.pdf",
                    "url": full_url
                }
            ]
        
        return tender
