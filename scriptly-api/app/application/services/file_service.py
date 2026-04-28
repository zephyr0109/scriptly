"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import os
import uuid
import logging
from pathlib import Path
from typing import Tuple
from pypdf import PdfReader
from docx import Document

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, upload_dir: str = None):
        if upload_dir is None:
            # 기본 경로: 프로젝트 root (scriptly 디렉토리) 하위의 data/output
            default_root = Path(__file__).resolve().parent.parent.parent.parent
            default_dir = default_root / "data" / "output"
            upload_dir = os.getenv("UPLOAD_DIR", str(default_dir))

        self.upload_dir = Path(upload_dir)
        if not self.upload_dir.exists():
            self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file_content: bytes, original_filename: str) -> Tuple[str, str]:
        """파일을 디스크에 저장하고 저장된 경로와 유니크한 파일명을 반환합니다."""
        logger.info(f"Executing save_file for original_filename: {original_filename}...")
        try:
            ext = os.path.splitext(original_filename)[1]
            unique_filename = f"{uuid.uuid4()}{ext}"
            save_path = self.upload_dir / unique_filename

            with open(save_path, "wb") as buffer:
                buffer.write(file_content)

            return str(save_path), unique_filename
        except Exception as e:
            logger.error(f"Error in save_file: {e}", exc_info=True)
            raise

    def extract_text(self, file_path: str) -> str:

        """파일 확장자에 따라 텍스트를 추출합니다."""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".txt":
            return self._extract_from_txt(file_path)
        elif ext == ".pdf":
            return self._extract_from_pdf(file_path)
        elif ext == ".docx":
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"지원하지 않는 파일 형식입니다: {ext}")

    def _extract_from_txt(self, file_path: str) -> str:
        encodings = ['utf-8', 'cp949', 'euc-kr']
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
        raise ValueError("텍스트 파일을 읽을 수 없습니다. 인코딩을 확인해주세요.")

    def _extract_from_pdf(self, file_path: str) -> str:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text.strip()

    def _extract_from_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs]).strip()

    def get_file_path(self, filename: str) -> Path:
        return self.upload_dir / filename
