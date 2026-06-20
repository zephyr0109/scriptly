# Use a Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-alpine

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (Korean fonts for PDF generation)
# font-noto-cjk는 TTC 내부 PostScript(CFF) 아웃라인 문제로 ReportLab 로드에 실패하므로, TTF 형식의 NanumGothic을 직접 내려받아 배치합니다.
RUN apk add --no-cache ca-certificates wget \
    && mkdir -p /usr/share/fonts/truetype/nanum \
    && wget -qO /usr/share/fonts/truetype/nanum/NanumGothic.ttf https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Regular.ttf

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy project files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy the rest of the application
COPY . .

# Place the virtual environment's bin directory on the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Run the application directly using virtualenv's python to prevent runtime downloads
CMD ["python", "main.py"]
