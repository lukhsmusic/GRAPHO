from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse
from pydantic import BaseModel

from grapho.templating import templates
from grapho.services import vault

router = APIRouter(prefix="/api")


@router.get("/tree", response_class=HTMLResponse)
async def get_tree(request: Request):
    tree = vault.list_tree()
    return templates.TemplateResponse(request, "partials/file_tree.html", {
        "tree": tree,
    })


@router.get("/file/{file_path:path}", response_class=PlainTextResponse)
async def get_file(file_path: str):
    try:
        return vault.read_file(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")


class SaveBody(BaseModel):
    content: str


@router.put("/file/{file_path:path}")
async def save_file(file_path: str, body: SaveBody):
    try:
        vault.write_file(file_path, body.content)
        return {"status": "ok"}
    except (FileNotFoundError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/file/{file_path:path}")
async def create_file(file_path: str):
    try:
        vault.create_file(file_path)
        return {"status": "ok"}
    except FileExistsError:
        raise HTTPException(status_code=409, detail="File already exists")
    except (FileNotFoundError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/dir/{dir_path:path}")
async def create_dir(dir_path: str):
    try:
        vault.create_dir(dir_path)
        return {"status": "ok"}
    except FileExistsError:
        raise HTTPException(status_code=409, detail="Directory already exists")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")


@router.delete("/file/{file_path:path}")
async def delete_file(file_path: str):
    try:
        vault.delete_file(file_path)
        return {"status": "ok"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
