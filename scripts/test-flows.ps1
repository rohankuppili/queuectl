Write-Host "🚀 Enqueueing jobs..."
node bin/queuectl enqueue '{"id":"job1","command":"echo Hello"}'
node bin/queuectl enqueue '{"id":"job2","command":"sleep 2"}'

Write-Host "⚙️ Starting 2 workers..."
node bin/queuectl worker --start --count 2

Start-Sleep -Seconds 5
Write-Host "📊 Status:"
node bin/queuectl status

Write-Host "✅ Done!"
