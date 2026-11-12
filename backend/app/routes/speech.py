from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from ..schemas.analysis import SynthesizeRequest, TranscribeResponse
from ..services import asr, tts

router = APIRouter(tags=["speech"])


@router.post("/speech/synthesize")
async def synthesize(req: SynthesizeRequest) -> StreamingResponse:
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    stream = await tts.synthesize(req.text, req.language, req.voice_id)
    return StreamingResponse(
        stream,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )


@router.post("/speech/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
) -> TranscribeResponse:
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio")
    result = await asr.transcribe(
        audio_bytes=data,
        filename=audio.filename or "audio.webm",
        mime_type=audio.content_type or "audio/webm",
        language=language,
    )
    return TranscribeResponse(**result)
