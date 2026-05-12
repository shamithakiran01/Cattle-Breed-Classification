import asyncio
import gdown
from pathlib import Path
import os

export_file_url = 'https://drive.google.com/u/0/uc?id=1x5Ljh9xtNfXFMm97AMlewW1nZ77XS-gb&export=download'
export_file_name = 'cattle_breed_classifier_full_model.pth'
path = Path("models/")
export_classes_url = "https://drive.google.com/u/0/uc?id=1IaF_zn-RDnsEntYp86F5G7FNlEkQ8KJ_&export=download"
export_classes_name = "classes.txt"

async def download_file(url, dest):
    if dest.exists(): 
        print(f"{dest} already exists.")
        return
    gdown.download(url, str(dest), quiet=False)

async def setup_learner():
    os.makedirs(path, exist_ok=True)
    await download_file(export_file_url, path / export_file_name)
    await download_file(export_classes_url, path / export_classes_name)

if __name__ == '__main__':
    asyncio.run(setup_learner())
