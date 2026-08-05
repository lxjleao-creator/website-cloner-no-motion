$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Port = if ($env:PORT) { [int]$env:PORT } else { 8765 }
$Prefix = "http://127.0.0.1:$Port/"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($Prefix)
$listener.Start()
Write-Host "Serving $Root at $Prefix"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".mp4" = "video/mp4"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $relative = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }
    $candidate = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
    if (-not $candidate.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }
    if (-not [System.IO.File]::Exists($candidate)) {
      $extProbe = [System.IO.Path]::GetExtension($candidate)
      if ([string]::IsNullOrWhiteSpace($extProbe)) {
        $candidate = [System.IO.Path]::GetFullPath((Join-Path $Root "index.html"))
      } else {
        $ctx.Response.StatusCode = 404
        $ctx.Response.Close()
        continue
      }
    }
    $ext = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
    $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($candidate)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } finally {
    $ctx.Response.OutputStream.Close()
  }
}
