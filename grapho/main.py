from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="GRAPHO")

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

from grapho.routers import pages, api  # noqa: E402

app.include_router(pages.router)
app.include_router(api.router)
