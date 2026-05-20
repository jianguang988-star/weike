@echo off
cd /d "%~dp0"
echo.
echo This will open .env.
echo.
echo For DeepSeek:
echo AI_PROVIDER="deepseek"
echo DEEPSEEK_API_KEY="sk-..."
echo DEEPSEEK_MODEL="deepseek-v4-flash"
echo.
echo For OpenAI:
echo AI_PROVIDER="openai"
echo OPENAI_API_KEY="sk-..."
echo.
notepad ".env"
