from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.config import get_settings
import httpx

router = APIRouter()
settings = get_settings()


def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    return authorization.split(' ', 1)[1]


@router.get('/api/auth/me')
async def get_current_user(authorization: Optional[str] = Header(None)):
    token = _extract_bearer(authorization)
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return {'id': 'dev-user', 'email': 'dev@agriproof.local', 'role': 'authenticated'}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            settings.supabase_url + '/auth/v1/user',
            headers={
                'Authorization': 'Bearer ' + token,
                'apikey': settings.supabase_service_role_key,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail='Invalid or expired session')
    return resp.json()


def get_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith('Bearer '):
        return None
    import base64, json as _json
    try:
        parts = authorization.split('.')
        b64 = parts[1] + '=' * (-len(parts[1]) % 4)
        payload = _json.loads(base64.urlsafe_b64decode(b64))
        return payload.get('sub')
    except Exception:
        return None
