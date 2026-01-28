import os
import sys

# DEBUG: Print current dir
with open("sync_debug.log", "w") as f:
    f.write(f"CWD: {os.getcwd()}\n")
    f.write(f"PATH: {sys.path}\n")

try:
    import asyncio
    from dotenv import load_dotenv
    sys.path.append(os.getcwd())
    load_dotenv()
    
    from app.core.supabase import get_supabase
    from app.services.matcher import get_matcher
    
    async def sync():
        with open("sync_debug.log", "a") as f:
            f.write("Starting sync...\n")
        
        supabase = get_supabase()
        result = supabase.table('knowledge_base').select('*').eq('is_active', True).execute()
        kb_items = result.data
        
        with open("sync_debug.log", "a") as f:
            f.write(f"Found {len(kb_items)} items\n")
            
        matcher = get_matcher()
        matcher.sync_with_database(kb_items)
        
        with open("sync_debug.log", "a") as f:
            f.write("Sync complete!\n")
            
    if __name__ == "__main__":
        asyncio.run(sync())
except Exception as e:
    with open("sync_debug.log", "a") as f:
        f.write(f"CRASH: {str(e)}\n")
        import traceback
        f.write(traceback.format_exc())
    sys.exit(1)
