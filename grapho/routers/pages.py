from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from grapho.templating import templates
from grapho.services import vault

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    tree = vault.list_tree()
    return templates.TemplateResponse(request, "base.html", {
        "tree": tree,
        "file_path": None,
        "file_content": None,
    })


@router.get("/edit/{file_path:path}", response_class=HTMLResponse)
async def edit(request: Request, file_path: str):
    tree = vault.list_tree()
    content = vault.read_file(file_path)
    return templates.TemplateResponse(request, "base.html", {
        "tree": tree,
        "file_path": file_path,
        "file_content": content,
    })
