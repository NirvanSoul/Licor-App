Write-Host "Iniciando actualización desde GitHub..."
git fetch origin
git reset --hard origin/main
Write-Host "¡Actualización completada! Por favor reinicia 'npm run dev' si es necesario."
